package com.startx.controller;

import com.startx.dto.ApiResponse;
import com.startx.dto.UserDto;
import com.startx.entity.AuthorizedEmail;
import com.startx.exception.NotImplementedException;
import com.startx.service.AuthorizedEmailService;
import com.startx.service.SupabaseAdminClient;
import com.startx.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Authentication and user-resolution controller.
 *
 * <p>The key endpoint is GET /api/v1/auth/me which implements the full
 * authorization chain:</p>
 *
 * <pre>
 * 1. Supabase ES256 JWT verified by Spring Security
 * 2. Extract: Supabase user UUID (sub) + verified email
 * 3. Look up public.users by UUID
 *    a. Found → return UserDto (fast path)
 *    b. Not found → check authorized_emails table
 *       i.  Not authorized → 403 "Your email is not authorized by your college administrator."
 *       ii. Authorized    → provision users + students/staff record
 *                         → update Supabase app_metadata.role via service-role API
 *                         → return UserDto with correct role
 * </pre>
 *
 * <p>Signup/login/logout are handled by Supabase Auth on the frontend.
 * The backend stubs remain to satisfy legacy frontend calls.</p>
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserService              userService;
    private final AuthorizedEmailService   authorizedEmailService;
    private final SupabaseAdminClient      supabaseAdminClient;

    public AuthController(UserService userService,
                          AuthorizedEmailService authorizedEmailService,
                          SupabaseAdminClient supabaseAdminClient) {
        this.userService            = userService;
        this.authorizedEmailService = authorizedEmailService;
        this.supabaseAdminClient    = supabaseAdminClient;
    }

    // -------------------------------------------------------------------------
    // Stubs — handled by Supabase on the frontend
    // -------------------------------------------------------------------------

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Object>> signup() {
        throw new NotImplementedException(
                "Auth is handled directly by Supabase on the frontend.");
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Object>> login() {
        throw new NotImplementedException(
                "Login is handled directly by Supabase on the frontend.");
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Object>> logout() {
        throw new NotImplementedException("Logout is not yet implemented.");
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Object>> refresh() {
        throw new NotImplementedException("Refresh is not yet implemented.");
    }

    // -------------------------------------------------------------------------
    // GET /api/v1/auth/me — full authorization resolution chain
    // -------------------------------------------------------------------------

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> me(Authentication authentication) {

        // Gate 1: authenticated?
        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return unauthorized("Unauthorized");
        }

        // Gate 2: valid UUID principal (Supabase sets sub = user UUID)
        String userIdStr = authentication.getName();
        UUID supabaseUserId;
        try {
            supabaseUserId = UUID.fromString(userIdStr);
        } catch (IllegalArgumentException e) {
            return badRequest("Invalid JWT subject — expected a UUID");
        }

        // Gate 3: must be a JWT token (not mock user)
        if (!(authentication instanceof JwtAuthenticationToken jwtAuth)) {
            return unauthorized("JWT authentication required");
        }
        Jwt jwt = jwtAuth.getToken();

        // Extract email from JWT (Supabase always includes email claim)
        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            return badRequest("JWT is missing the email claim");
        }
        email = email.trim().toLowerCase();

        // =====================================================================
        // FAST PATH: application user record already exists
        // =====================================================================
        Optional<UserDto> existing = userService.getUserById(supabaseUserId);
        if (existing.isPresent()) {
            log.debug("Fast path: found existing user record for {}", email);
            return ResponseEntity.ok(ApiResponse.success(existing.get()));
        }

        // =====================================================================
        // SLOW PATH: first login — check authorization, then provision
        // =====================================================================

        // Step 1: Check authorized_emails
        Optional<AuthorizedEmail> authorization =
                authorizedEmailService.findActiveAuthorization(email);

        if (authorization.isEmpty()) {
            log.info("Login denied: email '{}' not authorized by admin", email);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false,
                            "Your email is not authorized by your college administrator.",
                            null));
        }

        AuthorizedEmail auth = authorization.get();
        String dbRole  = auth.getRole();      // student | staff | admin
        String appRole = AuthorizedEmailService.toAppRole(dbRole);

        // Step 2: Extract display name from JWT user_metadata
        String fullName = extractFullName(jwt, email);

        // Step 3: Provision users + student/staff records (idempotent)
        UserDto provisioned;
        try {
            provisioned = userService.provisionUser(supabaseUserId, email, fullName, dbRole);
        } catch (Exception e) {
            log.error("Failed to provision user {}: {}", email, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Account provisioning failed: " + e.getMessage(), null));
        }

        // Step 4: Update Supabase app_metadata.role so future JWTs carry the role
        //         (non-fatal if this fails — the DB record is the source of truth)
        try {
            supabaseAdminClient.updateAppMetadataRole(supabaseUserId.toString(), dbRole);
            log.info("Updated Supabase app_metadata.role={} for user {}", dbRole, email);
        } catch (Exception e) {
            log.warn("Could not update Supabase app_metadata for {}: {}", email, e.getMessage());
        }

        // Step 5: Link authorized_email entry → users record
        try {
            authorizedEmailService.linkUser(email, supabaseUserId);
        } catch (Exception e) {
            log.warn("Could not link authorized_email for {}: {}", email, e.getMessage());
        }

        log.info("Provisioned new {} user: {}", appRole, email);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(provisioned));
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private String extractFullName(Jwt jwt, String email) {
        try {
            Map<String, Object> userMeta = jwt.getClaimAsMap("user_metadata");
            if (userMeta != null) {
                Object name = userMeta.get("name");
                if (name != null && !name.toString().isBlank()) {
                    return name.toString().trim();
                }
                Object fullName = userMeta.get("full_name");
                if (fullName != null && !fullName.toString().isBlank()) {
                    return fullName.toString().trim();
                }
            }
        } catch (Exception ignored) {}
        // Fall back to email prefix
        return email.contains("@") ? email.split("@")[0] : email;
    }

    private ResponseEntity<ApiResponse<UserDto>> unauthorized(String message) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(false, message, null));
    }

    private ResponseEntity<ApiResponse<UserDto>> badRequest(String message) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, message, null));
    }
}
