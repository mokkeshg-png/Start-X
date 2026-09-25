package com.startx;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.startx.entity.AuthorizedEmail;
import com.startx.repository.AuthorizedEmailRepository;
import com.startx.repository.UserRepository;
import com.startx.service.AuthorizedEmailService;
import com.startx.service.SupabaseAdminClient;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the College Admin + Student + Faculty Email
 * Authorization System.
 *
 * Uses H2 in-memory database in PostgreSQL MODE for Spring context.
 * SupabaseAdminClient is replaced with a no-op test double using
 * @TestConfiguration + @Primary (avoids Mockito/Byte Buddy issues on JDK 26).
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:authtest;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=password",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=https://rrosugsevmwzcailipyd.supabase.co/auth/v1/.well-known/jwks.json",
        "spring.security.oauth2.resourceserver.jwt.issuer-uri=https://rrosugsevmwzcailipyd.supabase.co/auth/v1",
        "app.admin.bootstrap-secret=test-secret-123",
        "app.supabase.url=https://rrosugsevmwzcailipyd.supabase.co",
        "app.supabase.service-role-key=test-service-role-key-placeholder"
})
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AuthorizationSystemTest {

    /**
     * No-op SupabaseAdminClient — avoids real HTTP calls during tests.
     * Uses @Primary to override the real bean without Mockito.
     */
    @TestConfiguration
    static class TestConfig {
        @Bean
        @Primary
        public SupabaseAdminClient noOpSupabaseAdminClient() {
            return new SupabaseAdminClient() {
                @Override
                public String inviteUser(String email, String role) {
                    return "00000000-0000-0000-0000-000000000000";
                }

                @Override
                public void updateAppMetadataRole(String supabaseUserId, String dbRole) {
                    // no-op in tests
                }
            };
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthorizedEmailRepository authorizedEmailRepository;

    @Autowired
    private UserRepository userRepository;

    // =========================================================================
    // 1. Unauthenticated request to admin API returns 401
    // =========================================================================
    @Test
    @Order(1)
    void test01_unauthenticated_admin_api_returns_401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/authorized-users"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 2. Unauthenticated /api/v1/auth/me returns 401
    // =========================================================================
    @Test
    @Order(2)
    void test02_unauthenticated_auth_me_returns_401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Unauthorized"));
    }

    // =========================================================================
    // 3. STUDENT cannot call admin API → 403
    // =========================================================================
    @Test
    @Order(3)
    @WithMockUser(roles = "STUDENT")
    void test03_student_cannot_call_admin_api() throws Exception {
        mockMvc.perform(get("/api/v1/admin/authorized-users"))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 4. FACULTY/TEACHER cannot call admin API → 403
    // =========================================================================
    @Test
    @Order(4)
    @WithMockUser(roles = "TEACHER")
    void test04_teacher_cannot_call_admin_api() throws Exception {
        mockMvc.perform(get("/api/v1/admin/authorized-users"))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 5. ADMIN can GET authorized-users list
    // =========================================================================
    @Test
    @Order(5)
    @WithMockUser(roles = "ADMIN")
    void test05_admin_can_get_authorized_list() throws Exception {
        mockMvc.perform(get("/api/v1/admin/authorized-users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    // =========================================================================
    // 6. ADMIN can POST single STUDENT email
    // =========================================================================
    @Test
    @Order(6)
    @WithMockUser(roles = "ADMIN")
    void test06_admin_can_add_student_email() throws Exception {
        Map<String, String> body = Map.of("email", "student1@test.com", "role", "STUDENT");

        mockMvc.perform(post("/api/v1/admin/authorized-users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("student1@test.com"))
                .andExpect(jsonPath("$.data.role").value("STUDENT"))
                .andExpect(jsonPath("$.data.status").value("pending"));
    }

    // =========================================================================
    // 7. ADMIN can POST single TEACHER email
    // =========================================================================
    @Test
    @Order(7)
    @WithMockUser(roles = "ADMIN")
    void test07_admin_can_add_teacher_email() throws Exception {
        Map<String, String> body = Map.of("email", "teacher1@college.edu", "role", "TEACHER");

        mockMvc.perform(post("/api/v1/admin/authorized-users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("teacher1@college.edu"))
                .andExpect(jsonPath("$.data.role").value("TEACHER"));
    }

    // =========================================================================
    // 8. Duplicate email → 409
    // =========================================================================
    @Test
    @Order(8)
    @WithMockUser(roles = "ADMIN")
    void test08_duplicate_email_rejected() throws Exception {
        // Seed first
        AuthorizedEmail ae = new AuthorizedEmail();
        ae.setEmail("dup@test.com");
        ae.setRole("student");
        ae.setStatus("pending");
        authorizedEmailRepository.saveAndFlush(ae);

        Map<String, String> body = Map.of("email", "dup@test.com", "role", "STUDENT");

        mockMvc.perform(post("/api/v1/admin/authorized-users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // 9. Invalid email → 4xx validation error
    // =========================================================================
    @Test
    @Order(9)
    @WithMockUser(roles = "ADMIN")
    void test09_invalid_email_rejected() throws Exception {
        Map<String, String> body = Map.of("email", "not-an-email", "role", "STUDENT");

        // Spring Boot 3.x returns 400 Bad Request for @Valid failures
        // (GlobalExceptionHandler handles MethodArgumentNotValidException → 400)
        mockMvc.perform(post("/api/v1/admin/authorized-users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().is4xxClientError()); // 400 or 422 depending on handler
    }

    // =========================================================================
    // 10. ADMIN can PUT update role
    // =========================================================================
    @Test
    @Order(10)
    @WithMockUser(roles = "ADMIN")
    void test10_admin_can_update_role() throws Exception {
        AuthorizedEmail ae = new AuthorizedEmail();
        ae.setEmail("update@test.com");
        ae.setRole("student");
        ae.setStatus("pending");
        AuthorizedEmail saved = authorizedEmailRepository.saveAndFlush(ae);

        Map<String, String> body = Map.of("role", "TEACHER");

        mockMvc.perform(put("/api/v1/admin/authorized-users/" + saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.role").value("TEACHER"));
    }

    // =========================================================================
    // 11. ADMIN can DELETE (soft revoke)
    // =========================================================================
    @Test
    @Order(11)
    @WithMockUser(roles = "ADMIN")
    void test11_admin_can_revoke_email() throws Exception {
        AuthorizedEmail ae = new AuthorizedEmail();
        ae.setEmail("revoke@test.com");
        ae.setRole("student");
        ae.setStatus("pending");
        AuthorizedEmail saved = authorizedEmailRepository.saveAndFlush(ae);

        mockMvc.perform(delete("/api/v1/admin/authorized-users/" + saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Verify status in DB
        AuthorizedEmail check = authorizedEmailRepository.findById(saved.getId()).orElseThrow();
        assertThat(check.getStatus()).isEqualTo("revoked");
    }

    // =========================================================================
    // 12. Bulk email add
    // =========================================================================
    @Test
    @Order(12)
    @WithMockUser(roles = "ADMIN")
    void test12_bulk_email_add() throws Exception {
        Map<String, Object> body = Map.of(
                "emails", List.of("bulk1@test.com", "bulk2@test.com", "bad-email"),
                "role", "STUDENT"
        );

        mockMvc.perform(post("/api/v1/admin/authorized-users/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.added").value(2))
                .andExpect(jsonPath("$.data.invalid").value(1));
    }

    // =========================================================================
    // 13–19. Role resolution (service-layer unit tests)
    // =========================================================================

    @Test @Order(13)
    void test13_role_appToDb_student() {
        assertThat(AuthorizedEmailService.toDbRole("STUDENT")).isEqualTo("student");
    }

    @Test @Order(14)
    void test14_role_appToDb_teacher() {
        assertThat(AuthorizedEmailService.toDbRole("TEACHER")).isEqualTo("staff");
    }

    @Test @Order(15)
    void test15_role_appToDb_admin() {
        assertThat(AuthorizedEmailService.toDbRole("ADMIN")).isEqualTo("admin");
    }

    @Test @Order(16)
    void test16_role_dbToApp_student() {
        assertThat(AuthorizedEmailService.toAppRole("student")).isEqualTo("STUDENT");
    }

    @Test @Order(17)
    void test17_role_dbToApp_staff() {
        assertThat(AuthorizedEmailService.toAppRole("staff")).isEqualTo("TEACHER");
    }

    @Test @Order(18)
    void test18_role_dbToApp_department_head() {
        assertThat(AuthorizedEmailService.toAppRole("department_head")).isEqualTo("TEACHER");
    }

    @Test @Order(19)
    void test19_role_dbToApp_admin() {
        assertThat(AuthorizedEmailService.toAppRole("admin")).isEqualTo("ADMIN");
    }

    // =========================================================================
    // 20–21. Health endpoints
    // =========================================================================

    @Test @Order(20)
    void test20_health_endpoint() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test @Order(21)
    void test21_database_health() throws Exception {
        mockMvc.perform(get("/api/v1/database/health"))
                .andExpect(jsonPath("$.database").value("supabase"));
    }

    // =========================================================================
    // 22–23. Bootstrap endpoint security
    // =========================================================================

    @Test @Order(22)
    @WithMockUser(roles = "USER")
    void test22_bootstrap_no_secret_returns_403() throws Exception {
        mockMvc.perform(post("/api/v1/admin/bootstrap"))
                .andExpect(status().isForbidden());
    }

    @Test @Order(23)
    @WithMockUser(roles = "USER")
    void test23_bootstrap_wrong_secret_returns_403() throws Exception {
        mockMvc.perform(post("/api/v1/admin/bootstrap")
                        .header("X-Bootstrap-Secret", "wrong-secret"))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 24. Filter by role query param
    // =========================================================================
    @Test @Order(24)
    @WithMockUser(roles = "ADMIN")
    void test24_filter_by_role() throws Exception {
        AuthorizedEmail ae = new AuthorizedEmail();
        ae.setEmail("filtertest@test.com");
        ae.setRole("student");
        ae.setStatus("pending");
        authorizedEmailRepository.saveAndFlush(ae);

        mockMvc.perform(get("/api/v1/admin/authorized-users?role=STUDENT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    // =========================================================================
    // 25. Email normalized to lowercase
    // =========================================================================
    @Test @Order(25)
    @WithMockUser(roles = "ADMIN")
    void test25_email_normalized_to_lowercase() throws Exception {
        Map<String, String> body = Map.of("email", "UPPERCASE@TEST.COM", "role", "STUDENT");

        mockMvc.perform(post("/api/v1/admin/authorized-users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.email").value("uppercase@test.com"));
    }
}
