package com.startx.controller.admin;

import com.startx.dto.ApiResponse;
import com.startx.dto.AuthorizedEmailDto;
import com.startx.service.AuthorizedEmailService;
import com.startx.service.SupabaseAdminClient;
import com.startx.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Bootstrap endpoint to promote the first admin user.
 *
 * <p>This endpoint is protected by a shared secret stored in the backend
 * environment variable {@code ADMIN_BOOTSTRAP_SECRET}. It allows a Supabase
 * Auth user with a valid JWT to be promoted to the 'admin' role in both the
 * application database and Supabase app_metadata.</p>
 *
 * <p>Use this ONE TIME to create the first college administrator. After the
 * first admin exists, use {@code /api/v1/admin/authorized-users} to manage
 * subsequent authorizations.</p>
 *
 * <p>Disable this endpoint in production by leaving
 * {@code ADMIN_BOOTSTRAP_SECRET} unset or empty.</p>
 *
 * <pre>
 * POST /api/v1/admin/bootstrap
 * Authorization: Bearer &lt;supabase-jwt&gt;
 * X-Bootstrap-Secret: &lt;secret-from-env&gt;
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/admin/bootstrap")
public class AdminBootstrapController {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapController.class);

    private final UserService            userService;
    private final AuthorizedEmailService authorizedEmailService;
    private final SupabaseAdminClient    supabaseAdminClient;

    @Value("${app.admin.bootstrap-secret:}")
    private String bootstrapSecret;

    public AdminBootstrapController(UserService userService,
                                    AuthorizedEmailService authorizedEmailService,
                                    SupabaseAdminClient supabaseAdminClient) {
        this.userService            = userService;
        this.authorizedEmailService = authorizedEmailService;
        this.supabaseAdminClient    = supabaseAdminClient;
    }

    /**
     * POST /api/v1/admin/bootstrap
     *
     * Promotes the authenticated JWT user to ADMIN role.
     * Requires the X-Bootstrap-Secret header to match the env secret.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> bootstrap(
            Authentication authentication,
            @RequestHeader(value = "X-Bootstrap-Secret", required = false) String providedSecret) {

        // Guard: secret must be set in env and must match
        if (bootstrapSecret == null || bootstrapSecret.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false,
                            "Bootstrap is disabled (ADMIN_BOOTSTRAP_SECRET not configured).", null));
        }
        if (!bootstrapSecret.equals(providedSecret)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false, "Invalid bootstrap secret.", null));
        }

        // Guard: valid authenticated JWT
        if (!(authentication instanceof JwtAuthenticationToken jwtAuth)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "JWT authentication required.", null));
        }
        Jwt jwt = jwtAuth.getToken();
        String userIdStr = authentication.getName();
        String email     = jwt.getClaimAsString("email");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "JWT missing email claim.", null));
        }
        email = email.trim().toLowerCase();

        UUID userId;
        try {
            userId = UUID.fromString(userIdStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Invalid JWT subject.", null));
        }

        try {
            // 1. Upsert authorized_emails entry for this admin
            if (!authorizedEmailService.findActiveAuthorization(email).isPresent()) {
                AuthorizedEmailDto ae = authorizedEmailService.bootstrapAdmin(email);
                log.info("Bootstrap: added authorized_emails entry for admin {}", email);
            }

            // 2. Provision users record with admin role
            String fullName = email.split("@")[0];
            Object userMeta = jwt.getClaims().get("user_metadata");
            if (userMeta instanceof java.util.Map<?,?> meta && meta.get("name") != null) {
                fullName = meta.get("name").toString();
            }
            userService.provisionUser(userId, email, fullName, "admin");
            log.info("Bootstrap: provisioned admin user record for {}", email);

            // 3. Update Supabase app_metadata
            supabaseAdminClient.updateAppMetadataRole(userId.toString(), "admin");
            log.info("Bootstrap: updated Supabase app_metadata.role=admin for {}", email);

            // 4. Link the authorized_email entry
            authorizedEmailService.linkUser(email, userId);

            return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "message", "Admin bootstrap successful.",
                    "email",   email,
                    "role",    "ADMIN"
            )));

        } catch (Exception e) {
            log.error("Bootstrap failed for {}: {}", email, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Bootstrap failed: " + e.getMessage(), null));
        }
    }
}
