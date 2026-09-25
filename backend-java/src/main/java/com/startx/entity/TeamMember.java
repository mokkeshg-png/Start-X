package com.startx.entity;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "team_members", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"team_id", "student_id"})
})
public class TeamMember {

    @Id
    @Column(name = "member_id", updatable = false, nullable = false)
    private UUID memberId;

    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "role", nullable = false)
    private String role;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private ZonedDateTime joinedAt;

    @Column(name = "left_at")
    private ZonedDateTime leftAt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    public TeamMember() {
    }

    @PrePersist
    protected void onCreate() {
        if (memberId == null) memberId = UUID.randomUUID();
        if (joinedAt == null) joinedAt = ZonedDateTime.now();
        if (role == null) role = "member";
        if (isActive == null) isActive = true;
    }

    public UUID getMemberId() { return memberId; }
    public void setMemberId(UUID memberId) { this.memberId = memberId; }

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) { this.teamId = teamId; }

    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public ZonedDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(ZonedDateTime joinedAt) { this.joinedAt = joinedAt; }

    public ZonedDateTime getLeftAt() { return leftAt; }
    public void setLeftAt(ZonedDateTime leftAt) { this.leftAt = leftAt; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
