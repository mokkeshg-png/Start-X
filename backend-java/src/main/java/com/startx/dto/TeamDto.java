package com.startx.dto;

import java.util.UUID;

public class TeamDto {
    private UUID teamId;
    private String teamName;
    private String problemStatement;
    private String description;
    private UUID leaderId;
    private UUID createdBy;
    private UUID departmentId;
    private String status;
    private Integer maxMembers;
    private String metadata;
    private String createdAt;

    public TeamDto() {}

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) { this.teamId = teamId; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public String getProblemStatement() { return problemStatement; }
    public void setProblemStatement(String problemStatement) { this.problemStatement = problemStatement; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public UUID getLeaderId() { return leaderId; }
    public void setLeaderId(UUID leaderId) { this.leaderId = leaderId; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public UUID getDepartmentId() { return departmentId; }
    public void setDepartmentId(UUID departmentId) { this.departmentId = departmentId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getMaxMembers() { return maxMembers; }
    public void setMaxMembers(Integer maxMembers) { this.maxMembers = maxMembers; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
