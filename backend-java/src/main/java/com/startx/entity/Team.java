package com.startx.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "teams")
public class Team {

    @Id
    @Column(name = "team_id", updatable = false, nullable = false)
    private UUID teamId;

    @Column(name = "team_name", nullable = false)
    private String teamName;

    @Column(name = "problem_statement")
    private String problemStatement;

    @Column(name = "description")
    private String description;

    @Column(name = "leader_id")
    private UUID leaderId;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "status", nullable = false)
    private String status; // 'draft', etc

    @Column(name = "max_members", nullable = false)
    private Integer maxMembers;

    @Column(name = "metadata", nullable = false, columnDefinition = "text")
    private String metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;

    public Team() {
    }

    @PrePersist
    protected void onCreate() {
        if (teamId == null) teamId = UUID.randomUUID();
        if (createdAt == null) createdAt = ZonedDateTime.now();
        updatedAt = ZonedDateTime.now();
        if (status == null) status = "draft";
        if (maxMembers == null) maxMembers = 6;
        if (metadata == null) metadata = "{}";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = ZonedDateTime.now();
    }

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

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
