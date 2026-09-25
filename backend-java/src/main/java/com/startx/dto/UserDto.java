package com.startx.dto;

import java.util.List;

public class UserDto {
    private String id;
    private String name;
    private String email;
    private String avatar;
    private String role; // 'ADMIN' | 'TEACHER' | 'STUDENT'
    
    // Extended profile fields
    private String department;
    private String year;
    private String bio;
    private List<String> skills;
    private String github;
    private String linkedin;
    private String studentId;
    private Boolean profileComplete;
    private String createdAt;

    public UserDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }
    public String getGithub() { return github; }
    public void setGithub(String github) { this.github = github; }
    public String getLinkedin() { return linkedin; }
    public void setLinkedin(String linkedin) { this.linkedin = linkedin; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public Boolean getProfileComplete() { return profileComplete; }
    public void setProfileComplete(Boolean profileComplete) { this.profileComplete = profileComplete; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
