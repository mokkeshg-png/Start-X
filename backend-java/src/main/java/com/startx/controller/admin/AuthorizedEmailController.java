package com.startx.controller.admin;

import com.startx.dto.ApiResponse;
import com.startx.dto.AuthorizedEmailDto;
import com.startx.dto.BulkAuthorizedEmailRequest;
import com.startx.service.AuthorizedEmailService;
import com.startx.service.AuthorizedEmailService.BulkResult;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST API for College Admin to manage the email authorization list.
 *
 * <p>All endpoints require an authenticated ADMIN JWT.
 * STUDENT and FACULTY/TEACHER callers receive 403 Forbidden.
 * Unauthenticated callers receive 401 Unauthorized.</p>
 *
 * <pre>
 * GET    /api/v1/admin/authorized-users          → list all authorized emails
 * GET    /api/v1/admin/authorized-users?role=... → filter by role
 * POST   /api/v1/admin/authorized-users          → add single email
 * POST   /api/v1/admin/authorized-users/bulk     → add multiple emails
 * PUT    /api/v1/admin/authorized-users/{id}     → update role/status
 * DELETE /api/v1/admin/authorized-users/{id}     → revoke (soft) or delete
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/admin/authorized-users")
@PreAuthorize("hasRole('ADMIN')")
public class AuthorizedEmailController {

    private static final Logger log = LoggerFactory.getLogger(AuthorizedEmailController.class);

    private final AuthorizedEmailService authorizedEmailService;

    public AuthorizedEmailController(AuthorizedEmailService authorizedEmailService) {
        this.authorizedEmailService = authorizedEmailService;
    }

    // -------------------------------------------------------------------------
    // GET  /api/v1/admin/authorized-users[?role=STUDENT|TEACHER|ADMIN]
    // -------------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuthorizedEmailDto>>> list(
            @RequestParam(name = "role", required = false) String role) {

        List<AuthorizedEmailDto> result = (role != null && !role.isBlank())
                ? authorizedEmailService.getByRole(role.toUpperCase())
                : authorizedEmailService.getAll();

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // -------------------------------------------------------------------------
    // POST /api/v1/admin/authorized-users
    // Body: { "email": "...", "role": "STUDENT|TEACHER|ADMIN" }
    // -------------------------------------------------------------------------

    @PostMapping
    public ResponseEntity<ApiResponse<AuthorizedEmailDto>> add(
            @Valid @RequestBody AuthorizedEmailDto request,
            Authentication authentication) {

        UUID adminId = resolveAdminId(authentication);

        try {
            AuthorizedEmailDto created = authorizedEmailService.add(
                    request.getEmail(),
                    request.getRole(),
                    adminId
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ApiResponse<>(false, ex.getMessage(), null));
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/v1/admin/authorized-users/bulk
    // Body: { "emails": ["a@b.com", ...], "role": "STUDENT" }
    // -------------------------------------------------------------------------

    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> bulkAdd(
            @Valid @RequestBody BulkAuthorizedEmailRequest request,
            Authentication authentication) {

        UUID adminId = resolveAdminId(authentication);

        try {
            BulkResult result = authorizedEmailService.bulkAdd(
                    request.getEmails(),
                    request.getRole(),
                    adminId
            );
            Map<String, Integer> summary = Map.of(
                    "added",   result.added(),
                    "skipped", result.skipped(),
                    "invalid", result.invalid()
            );
            return ResponseEntity.ok(ApiResponse.success(summary));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, ex.getMessage(), null));
        }
    }

    // -------------------------------------------------------------------------
    // PUT /api/v1/admin/authorized-users/{id}
    // Body: { "role": "TEACHER", "status": "revoked" }   (both optional)
    // -------------------------------------------------------------------------

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AuthorizedEmailDto>> update(
            @PathVariable UUID id,
            @RequestBody AuthorizedEmailDto request) {

        try {
            AuthorizedEmailDto updated = authorizedEmailService.update(
                    id,
                    request.getRole(),
                    request.getStatus()
            );
            return ResponseEntity.ok(ApiResponse.success(updated));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, ex.getMessage(), null));
        }
    }

    // -------------------------------------------------------------------------
    // DELETE /api/v1/admin/authorized-users/{id}
    // Query param: ?hard=true  → permanent delete; default: soft revoke
    // -------------------------------------------------------------------------

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> remove(
            @PathVariable UUID id,
            @RequestParam(name = "hard", defaultValue = "false") boolean hard) {

        try {
            if (hard) {
                authorizedEmailService.delete(id);
                return ResponseEntity.ok(ApiResponse.success(null));
            } else {
                authorizedEmailService.revoke(id);
                return ResponseEntity.ok(new ApiResponse<>(true, "Authorization revoked", null));
            }
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, ex.getMessage(), null));
        }
    }

    // -------------------------------------------------------------------------
    // Helper: extract admin UUID from JWT principal
    // -------------------------------------------------------------------------

    private UUID resolveAdminId(Authentication authentication) {
        try {
            if (authentication != null) {
                return UUID.fromString(authentication.getName());
            }
        } catch (Exception ex) {
            log.warn("Could not resolve admin UUID from principal: {}", ex.getMessage());
        }
        return null;
    }
}
