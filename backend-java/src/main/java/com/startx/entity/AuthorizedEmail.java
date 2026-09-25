package com.startx.entity;

import jakarta.persistence.*;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Represents a pre-authorized email entry managed by a College Admin.
 *
 * <p>Before any user can register and gain application access, their email
 * must appear in this table with an assigned role. The backend resolves
 * this entry at login time to create/link the application user record.</p>
 *
 * <p>role values match the PostgreSQL {@code user_role_type} enum:
 * {@code student | staff | department_head | admin}.</p>
 */
@Entity
@Table(name = "authorized_emails")
public class AuthorizedEmail {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    /**
     * DB enum: student | staff | department_head | admin.
     * Stored as VARCHAR; columnDefinition is not set so H2 uses VARCHAR
     * (Postgres uses the user_role_type enum natively via DB schema).
     */
    @Column(name = "role", nullable = false)
    private String role;

    /** pending | registered | active | revoked */
    @Column(name = "status", nullable = false)
    private String status = "pending";

    /** UUID of the admin user who created this entry. Nullable (bootstrap case). */
    @Column(name = "added_by")
    private UUID addedBy;

    /** UUID of the application users.user_id once the user has registered. */
    @Column(name = "linked_user_id")
    private UUID linkedUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;

    public AuthorizedEmail() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
        createdAt = ZonedDateTime.now();
        updatedAt = ZonedDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = ZonedDateTime.now();
    }

    // -------------------------------------------------------------------------
    // Getters / setters
    // -------------------------------------------------------------------------

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getAddedBy() { return addedBy; }
    public void setAddedBy(UUID addedBy) { this.addedBy = addedBy; }

    public UUID getLinkedUserId() { return linkedUserId; }
    public void setLinkedUserId(UUID linkedUserId) { this.linkedUserId = linkedUserId; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
