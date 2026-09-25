package com.startx.dto;

import java.util.UUID;

public class TeamRequirementDto {
    private UUID requirementId;
    private UUID teamId;
    private String requirement;
    private String category;
    private String priority;
    private Boolean isMet;

    public TeamRequirementDto() {}

    public UUID getRequirementId() { return requirementId; }
    public void setRequirementId(UUID requirementId) { this.requirementId = requirementId; }

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) { this.teamId = teamId; }

    public String getRequirement() { return requirement; }
    public void setRequirement(String requirement) { this.requirement = requirement; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public Boolean getIsMet() { return isMet; }
    public void setIsMet(Boolean isMet) { this.isMet = isMet; }
}
