package com.startx.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "student_profiles")
public class StudentProfile {
    @Id
    @Column(name = "profile_id", updatable = false, nullable = false)
    private UUID profileId;

    @Column(name = "student_id", nullable = false, unique = true)
    private UUID studentId;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "portfolio_url")
    private String portfolioUrl;

    @Column(name = "bio")
    private String bio;

    @Column(name = "availability")
    private String availability;

    @Column(name = "looking_for_team")
    private Boolean lookingForTeam;

    public StudentProfile() {}

    public UUID getProfileId() { return profileId; }
    public void setProfileId(UUID profileId) { this.profileId = profileId; }
    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }
    public String getGithubUrl() { return githubUrl; }
    public void setGithubUrl(String githubUrl) { this.githubUrl = githubUrl; }
    public String getLinkedinUrl() { return linkedinUrl; }
    public void setLinkedinUrl(String linkedinUrl) { this.linkedinUrl = linkedinUrl; }
    public String getPortfolioUrl() { return portfolioUrl; }
    public void setPortfolioUrl(String portfolioUrl) { this.portfolioUrl = portfolioUrl; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }
    public Boolean getLookingForTeam() { return lookingForTeam; }
    public void setLookingForTeam(Boolean lookingForTeam) { this.lookingForTeam = lookingForTeam; }
}
