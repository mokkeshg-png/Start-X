package com.startx;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.startx.dto.*;
import com.startx.repository.StudentProfileRepository;
import com.startx.repository.StudentRepository;
import com.startx.repository.UserRepository;
import com.startx.entity.StudentProfile;
import com.startx.entity.Student;
import com.startx.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb2;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=password",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class ProjectTeamIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    private UUID profileId;
    private UUID studentId;
    private UUID userId;

    @BeforeEach
    void setup() {
        if (profileId == null) {
            userId = UUID.randomUUID();
            User u = new User();
            u.setUserId(userId);
            u.setEmail(UUID.randomUUID().toString() + "@test.com");
            u.setFullName("Test User");
            u.setRole("STUDENT");
            u.setIsActive(true);
            userRepository.save(u);

            studentId = UUID.randomUUID();
            Student s = new Student();
            s.setStudentId(studentId);
            s.setUserId(userId);
            studentRepository.save(s);

            profileId = UUID.randomUUID();
            StudentProfile sp = new StudentProfile();
            sp.setProfileId(profileId);
            sp.setStudentId(studentId);
            studentProfileRepository.save(sp);
        }
    }

    @Test
    @WithMockUser
    void testProjectCrud() throws Exception {
        ProjectDto p = new ProjectDto();
        p.setProfileId(profileId);
        p.setProjectName("Test Project");
        
        // Create
        String response = mockMvc.perform(post("/api/v1/projects")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(p)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn().getResponse().getContentAsString();

        // Extract ID (simplified hack)
        String idStr = response.split("\"projectId\":\"")[1].split("\"")[0];
        
        // Read
        mockMvc.perform(get("/api/v1/projects/" + idStr))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.projectName").value("Test Project"));

        p.setProjectName("Updated Project");
        p.setTechnologies("[]");
        p.setFiles("[]");
        p.setIsFeatured(false);
        mockMvc.perform(put("/api/v1/projects/" + idStr)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(p)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.projectName").value("Updated Project"));

        // Delete
        mockMvc.perform(delete("/api/v1/projects/" + idStr))
                .andExpect(status().isOk());

        // Verify Delete
        mockMvc.perform(get("/api/v1/projects/" + idStr))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    void testTeamAndMembersAndRoles() throws Exception {
        TeamDto t = new TeamDto();
        t.setTeamName("Test Team");
        t.setLeaderId(studentId);
        t.setCreatedBy(userId);
        
        // Create Team
        String tRes = mockMvc.perform(post("/api/v1/teams")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(t)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String teamId = tRes.split("\"teamId\":\"")[1].split("\"")[0];

        // Add Member
        TeamMemberDto m = new TeamMemberDto();
        m.setStudentId(studentId);
        mockMvc.perform(post("/api/v1/teams/" + teamId + "/members")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(m)))
                .andExpect(status().isOk());

        // Add Duplicate Member
        mockMvc.perform(post("/api/v1/teams/" + teamId + "/members")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(m)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        // List Members
        mockMvc.perform(get("/api/v1/teams/" + teamId + "/members"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].studentId").value(studentId.toString()));

        // Assign Role
        TeamRoleDto r = new TeamRoleDto();
        r.setRoleName("Developer");
        mockMvc.perform(post("/api/v1/teams/" + teamId + "/roles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(r)))
                .andExpect(status().isOk());

        // Create Requirement
        TeamRequirementDto req = new TeamRequirementDto();
        req.setRequirement("Must know Java");
        req.setPriority("high");
        mockMvc.perform(post("/api/v1/teams/" + teamId + "/requirements")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        // Create Compatibility Analysis
        CompatibilityAnalysisDto comp = new CompatibilityAnalysisDto();
        comp.setRequiredSkills("[\"Java\"]");
        comp.setCoveredSkills("[]");
        comp.setMissingSkills("[\"Java\"]");
        comp.setAiReasoning("{}");
        mockMvc.perform(post("/api/v1/teams/" + teamId + "/compatibility")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(comp)))
                .andExpect(status().isOk());

        // Read all
        mockMvc.perform(get("/api/v1/teams/" + teamId + "/roles")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/teams/" + teamId + "/requirements")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/teams/" + teamId + "/compatibility")).andExpect(status().isOk());

        // Remove Member
        mockMvc.perform(delete("/api/v1/teams/" + teamId + "/members/" + studentId))
                .andExpect(status().isOk());

        // Delete Team
        mockMvc.perform(delete("/api/v1/teams/" + teamId))
                .andExpect(status().isOk());
    }

    @Test
    void testUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isUnauthorized());
    }
}
