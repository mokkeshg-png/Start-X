package com.startx.entity;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "team_roles")
public class TeamRole {

    @Id
    @Column(name = "role_id", updatable = false, nullable = false)
    private UUID roleId;

    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @Column(name = "role_name", nullable = false)
    private String roleName;

    @Column(name = "description")
    private String description;

    @Column(name = "required_skills", nullable = false, columnDefinition = "text")
    private String requiredSkills;

    @Column(name = "is_filled", nullable = false)
    private Boolean isFilled;

    @Column(name = "filled_by")
    private UUID filledBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    public TeamRole() {
    }

    @PrePersist
    protected void onCreate() {
        if (roleId == null) roleId = UUID.randomUUID();
        if (createdAt == null) createdAt = ZonedDateTime.now();
        if (requiredSkills == null) requiredSkills = "[]";
        if (isFilled == null) isFilled = false;
    }

    public UUID getRoleId() { return roleId; }
    public void setRoleId(UUID roleId) { this.roleId = roleId; }

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) { this.teamId = teamId; }

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getRequiredSkills() { return requiredSkills; }
    public void setRequiredSkills(String requiredSkills) { this.requiredSkills = requiredSkills; }

    public Boolean getIsFilled() { return isFilled; }
    public void setIsFilled(Boolean isFilled) { this.isFilled = isFilled; }

    public UUID getFilledBy() { return filledBy; }
    public void setFilledBy(UUID filledBy) { this.filledBy = filledBy; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}
