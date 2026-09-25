package com.startx.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO for Admin email authorization requests and responses.
 *
 * <p>On input: email + role are required.
 * On output: all fields are populated.</p>
 */
public class AuthorizedEmailDto {

    private String id;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    private String email;

    /**
     * Application role.  Accepted values: STUDENT | TEACHER | ADMIN.
     * Mapped to the DB enum: student | staff | admin before persistence.
     */
    @NotBlank(message = "Role is required")
    @Pattern(regexp = "^(STUDENT|TEACHER|ADMIN)$",
             message = "Role must be STUDENT, TEACHER, or ADMIN")
    private String role;

    /** pending | registered | active | revoked */
    private String status;

    /** Display name of the admin who authorized this email */
    private String addedByName;

    private String createdAt;
    private String updatedAt;

    /** UUID of the linked application user (set after first login) */
    private String linkedUserId;

    public AuthorizedEmailDto() {}

    // -------------------------------------------------------------------------
    // Getters / setters
    // -------------------------------------------------------------------------

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAddedByName() { return addedByName; }
    public void setAddedByName(String addedByName) { this.addedByName = addedByName; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getLinkedUserId() { return linkedUserId; }
    public void setLinkedUserId(String linkedUserId) { this.linkedUserId = linkedUserId; }
}
