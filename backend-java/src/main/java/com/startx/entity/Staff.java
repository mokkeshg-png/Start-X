package com.startx.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "staff")
public class Staff {
    @Id
    @Column(name = "staff_id", updatable = false, nullable = false)
    private UUID staffId;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "staff_number")
    private String staffNumber;

    @Column(name = "title")
    private String title;

    @Column(name = "specialization")
    private String specialization;

    public Staff() {}

    public UUID getStaffId() { return staffId; }
    public void setStaffId(UUID staffId) { this.staffId = staffId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
    public String getStaffNumber() { return staffNumber; }
    public void setStaffNumber(String staffNumber) { this.staffNumber = staffNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
}
