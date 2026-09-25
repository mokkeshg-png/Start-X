package com.startx.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;

import java.util.List;

/**
 * Request DTO for bulk email authorization.
 */
public class BulkAuthorizedEmailRequest {

    @NotEmpty(message = "At least one email is required")
    private List<String> emails;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "^(STUDENT|TEACHER|FACULTY|ADMIN)$",
             message = "Role must be STUDENT, TEACHER, FACULTY, or ADMIN")
    private String role;

    public BulkAuthorizedEmailRequest() {}

    public List<String> getEmails() { return emails; }
    public void setEmails(List<String> emails) { this.emails = emails; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
