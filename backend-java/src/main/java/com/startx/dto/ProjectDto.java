package com.startx.dto;

import java.util.UUID;

public class ProjectDto {
    private UUID projectId;
    private UUID profileId;
    private String projectName;
    private String description;
    private String technologies;
    private String repositoryUrl;
    private String demoUrl;
    private String files;
    private Boolean isFeatured;
    private String submittedAt;

    public ProjectDto() {}

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

    public String getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }
}
