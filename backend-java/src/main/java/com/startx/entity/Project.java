package com.startx.entity;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @Column(name = "project_id", updatable = false, nullable = false)
    private UUID projectId;

    @Column(name = "profile_id", nullable = false)
    private UUID profileId;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    @Column(name = "description")
    private String description;

    @Column(name = "technologies", nullable = false, columnDefinition = "text")
    private String technologies;

    @Column(name = "repository_url")
    private String repositoryUrl;

    @Column(name = "demo_url")
    private String demoUrl;

    @Column(name = "files", nullable = false, columnDefinition = "text")
    private String files;

    @Column(name = "is_featured", nullable = false)
    private Boolean isFeatured;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private ZonedDateTime submittedAt;

    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;

    public Project() {
    }

    @PrePersist
    protected void onCreate() {
        if (projectId == null) projectId = UUID.randomUUID();
        if (submittedAt == null) submittedAt = ZonedDateTime.now();
        updatedAt = ZonedDateTime.now();
        if (isFeatured == null) isFeatured = false;
        if (technologies == null) technologies = "[]";
        if (files == null) files = "[]";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = ZonedDateTime.now();
    }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }

    public UUID getProfileId() { return profileId; }
    public void setProfileId(UUID profileId) { this.profileId = profileId; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTechnologies() { return technologies; }
    public void setTechnologies(String technologies) { this.technologies = technologies; }

    public String getRepositoryUrl() { return repositoryUrl; }
    public void setRepositoryUrl(String repositoryUrl) { this.repositoryUrl = repositoryUrl; }

    public String getDemoUrl() { return demoUrl; }
    public void setDemoUrl(String demoUrl) { this.demoUrl = demoUrl; }

    public String getFiles() { return files; }
    public void setFiles(String files) { this.files = files; }

    public Boolean getIsFeatured() { return isFeatured; }
    public void setIsFeatured(Boolean isFeatured) { this.isFeatured = isFeatured; }

    public ZonedDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(ZonedDateTime submittedAt) { this.submittedAt = submittedAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
