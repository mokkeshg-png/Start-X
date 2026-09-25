package com.startx.service;

import com.startx.dto.AuthorizedEmailDto;
import com.startx.entity.AuthorizedEmail;
import com.startx.entity.User;
import com.startx.repository.AuthorizedEmailRepository;
import com.startx.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Business logic for the College Admin email authorization system.
 *
 * <p>Role mapping (application ↔ DB):</p>
 * <pre>
 *   Application  →  DB user_role_type
 *   STUDENT      →  student
 *   TEACHER      →  staff
 *   ADMIN        →  admin
 * </pre>
 *
 * <p>The backend uses the service-role JDBC URL, which bypasses Supabase RLS,
 * so all reads/writes succeed regardless of the RLS admin-only policies.</p>
 */
@Service
public class AuthorizedEmailService {

    private static final Logger log = LoggerFactory.getLogger(AuthorizedEmailService.class);

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$");

    private final AuthorizedEmailRepository authorizedEmailRepository;
    private final UserRepository userRepository;

    public AuthorizedEmailService(AuthorizedEmailRepository authorizedEmailRepository,
                                  UserRepository userRepository) {
        this.authorizedEmailRepository = authorizedEmailRepository;
        this.userRepository = userRepository;
    }

    // =========================================================================
    // CRUD
    // =========================================================================

    /**
     * Retrieve all authorized email entries.
     */
    public List<AuthorizedEmailDto> getAll() {
        return authorizedEmailRepository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Retrieve authorized email entries filtered by application role.
     *
     * @param appRole STUDENT | TEACHER | ADMIN
     */
    public List<AuthorizedEmailDto> getByRole(String appRole) {
        String dbRole = toDbRole(appRole);
        return authorizedEmailRepository.findByRole(dbRole)
                .stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Add a single authorized email.
     *
     * @param email       raw email (will be normalized)
     * @param appRole     STUDENT | TEACHER | ADMIN
     * @param addedByUuid UUID of the admin performing the action (nullable for bootstrap)
     * @return the created DTO
     */
    @Transactional
    public AuthorizedEmailDto add(String email, String appRole, UUID addedByUuid) {
        String clean = normalize(email);
        validateEmail(clean);

        if (authorizedEmailRepository.existsByEmail(clean)) {
            throw new IllegalArgumentException("Email '" + clean + "' is already authorized.");
        }

        // ADMIN role: only an existing admin can authorize another admin
        if ("ADMIN".equalsIgnoreCase(appRole) && addedByUuid == null) {
            throw new IllegalArgumentException("An existing admin must authorize ADMIN-role emails.");
        }

        AuthorizedEmail entity = new AuthorizedEmail();
        entity.setEmail(clean);
        entity.setRole(toDbRole(appRole));
        entity.setStatus("pending");
        entity.setAddedBy(addedByUuid);

        AuthorizedEmail saved = authorizedEmailRepository.save(entity);
        log.info("Admin {} authorized email {} as {}", addedByUuid, clean, appRole);
        return toDto(saved);
    }

    /**
     * Add the initial bootstrap admin without requiring an existing admin UUID.
     */
    @Transactional
    public AuthorizedEmailDto bootstrapAdmin(String email) {
        String clean = normalize(email);
        validateEmail(clean);

        if (authorizedEmailRepository.existsByEmail(clean)) {
            return findActiveAuthorization(clean).map(this::toDto).orElseThrow();
        }

        AuthorizedEmail entity = new AuthorizedEmail();
        entity.setEmail(clean);
        entity.setRole(toDbRole("ADMIN"));
        entity.setStatus("pending");
        entity.setAddedBy(null);

        AuthorizedEmail saved = authorizedEmailRepository.save(entity);
        log.info("Bootstrap authorized email {} as ADMIN", clean);
        return toDto(saved);
    }

    /**
     * Bulk-add authorized emails.
     *
     * @param emails    list of raw email strings
     * @param appRole   STUDENT | TEACHER | ADMIN
     * @param adminUuid UUID of the performing admin
     * @return summary {added, skipped, invalid}
     */
    @Transactional
    public BulkResult bulkAdd(List<String> emails, String appRole, UUID adminUuid) {
        if ("ADMIN".equalsIgnoreCase(appRole)) {
            throw new IllegalArgumentException("Bulk upload cannot be used to authorize ADMIN-role emails.");
        }

        int added = 0, skipped = 0, invalid = 0;

        for (String raw : emails) {
            String clean = normalize(raw);
            if (clean.isEmpty() || !EMAIL_PATTERN.matcher(clean).matches()) {
                invalid++;
                continue;
            }
            if (authorizedEmailRepository.existsByEmail(clean)) {
                skipped++;
                continue;
            }
            AuthorizedEmail entity = new AuthorizedEmail();
            entity.setEmail(clean);
            entity.setRole(toDbRole(appRole));
            entity.setStatus("pending");
            entity.setAddedBy(adminUuid);
            authorizedEmailRepository.save(entity);
            added++;
        }

        log.info("Bulk authorized {} {} emails (skipped={}, invalid={})", added, appRole, skipped, invalid);
        return new BulkResult(added, skipped, invalid);
    }

    /**
     * Update role or status for an existing entry.
     */
    @Transactional
    public AuthorizedEmailDto update(UUID id, String appRole, String status) {
        AuthorizedEmail entity = authorizedEmailRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Authorized email not found: " + id));

        if (appRole != null && !appRole.isBlank()) {
            entity.setRole(toDbRole(appRole));
        }
        if (status != null && !status.isBlank()) {
            entity.setStatus(status.toLowerCase());
        }

        return toDto(authorizedEmailRepository.save(entity));
    }

    /**
     * Soft-revoke: set status = 'revoked'.
     */
    @Transactional
    public void revoke(UUID id) {
        AuthorizedEmail entity = authorizedEmailRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Authorized email not found: " + id));
        entity.setStatus("revoked");
        authorizedEmailRepository.save(entity);
        log.info("Revoked authorization for email id={}", id);
    }

    /**
     * Hard-delete an authorized email entry.
     */
    @Transactional
    public void delete(UUID id) {
        if (!authorizedEmailRepository.existsById(id)) {
            throw new IllegalArgumentException("Authorized email not found: " + id);
        }
        authorizedEmailRepository.deleteById(id);
        log.info("Deleted authorization entry id={}", id);
    }

    // =========================================================================
    // Authorization lookup (used by /api/v1/auth/me flow)
    // =========================================================================

    /**
     * Look up an active authorization for the given email.
     * Returns empty if the email is not authorized OR has been revoked.
     */
    public Optional<AuthorizedEmail> findActiveAuthorization(String email) {
        return authorizedEmailRepository.findByEmail(normalize(email))
                .filter(ae -> !"revoked".equalsIgnoreCase(ae.getStatus()));
    }

    /**
     * After a user successfully registers, link their application user_id
     * and update status to 'registered'.
     */
    @Transactional
    public void linkUser(String email, UUID userId) {
        int updated = authorizedEmailRepository.linkUser(normalize(email), userId, "registered");
        if (updated > 0) {
            log.info("Linked user {} to authorized email {}", userId, email);
        }
    }

    /**
     * After a user's account is fully active, update status to 'active'.
     */
    @Transactional
    public void markActive(String email) {
        authorizedEmailRepository.findByEmail(normalize(email)).ifPresent(ae -> {
            ae.setStatus("active");
            authorizedEmailRepository.save(ae);
        });
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private void validateEmail(String email) {
        if (email.isEmpty() || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Invalid email address: '" + email + "'");
        }
    }

    /**
     * Maps application role (STUDENT/TEACHER/ADMIN) to DB enum value.
     */
    public static String toDbRole(String appRole) {
        if (appRole == null) return "student";
        return switch (appRole.toUpperCase().trim()) {
            case "ADMIN"   -> "admin";
            case "TEACHER", "FACULTY", "STAFF" -> "staff";
            case "STUDENT" -> "student";
            default        -> "student";
        };
    }

    /**
     * Maps DB enum value (student/staff/department_head/admin) to application role.
     */
    public static String toAppRole(String dbRole) {
        if (dbRole == null) return "STUDENT";
        return switch (dbRole.toLowerCase().trim()) {
            case "admin"           -> "ADMIN";
            case "staff", "department_head" -> "TEACHER";
            case "student"         -> "STUDENT";
            default                -> "STUDENT";
        };
    }

    private AuthorizedEmailDto toDto(AuthorizedEmail ae) {
        AuthorizedEmailDto dto = new AuthorizedEmailDto();
        dto.setId(ae.getId() != null ? ae.getId().toString() : null);
        dto.setEmail(ae.getEmail());
        dto.setRole(toAppRole(ae.getRole()));
        dto.setStatus(ae.getStatus());
        dto.setCreatedAt(ae.getCreatedAt() != null ? ae.getCreatedAt().toString() : null);
        dto.setUpdatedAt(ae.getUpdatedAt() != null ? ae.getUpdatedAt().toString() : null);
        dto.setLinkedUserId(ae.getLinkedUserId() != null ? ae.getLinkedUserId().toString() : null);

        // Resolve added-by name from users table
        if (ae.getAddedBy() != null) {
            userRepository.findById(ae.getAddedBy())
                    .ifPresent(u -> dto.setAddedByName(u.getFullName()));
        }
        return dto;
    }

    // =========================================================================
    // Nested result type
    // =========================================================================

    public record BulkResult(int added, int skipped, int invalid) {}
}
