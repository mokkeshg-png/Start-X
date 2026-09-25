package com.startx.dto;

import java.util.UUID;

public class TeamRoleDto {
    private UUID roleId;
    private UUID teamId;
    private String roleName;
    private String description;
    private String requiredSkills;
    private Boolean isFilled;
    private UUID filledBy;
    private String createdAt;

    public TeamRoleDto() {}

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

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
