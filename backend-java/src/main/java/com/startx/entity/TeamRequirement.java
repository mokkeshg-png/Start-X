package com.startx.entity;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "team_requirements")
public class TeamRequirement {

    @Id
    @Column(name = "requirement_id", updatable = false, nullable = false)
    private UUID requirementId;

    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @Column(name = "requirement", nullable = false)
    private String requirement;

    @Column(name = "category")
    private String category;

    @Column(name = "priority", nullable = false)
    private String priority; // 'low', 'medium', 'high', 'critical'

    @Column(name = "is_met", nullable = false)
    private Boolean isMet;

    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;

    public TeamRequirement() {
    }

    @PrePersist
    protected void onCreate() {
        if (requirementId == null) requirementId = UUID.randomUUID();
        if (createdAt == null) createdAt = ZonedDateTime.now();
        updatedAt = ZonedDateTime.now();
        if (priority == null) priority = "medium";
        if (isMet == null) isMet = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = ZonedDateTime.now();
    }

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

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
