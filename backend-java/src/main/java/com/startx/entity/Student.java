package com.startx.entity;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "students")
public class Student {
    @Id
    @Column(name = "student_id", updatable = false, nullable = false)
    private UUID studentId;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "student_number")
    private String studentNumber;

    @Column(name = "enrollment_year")
    private Integer enrollmentYear;

    @Column(name = "program")
    private String program;

    @Column(name = "year_of_study")
    private Integer yearOfStudy;

    public Student() {}

    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
    public String getStudentNumber() { return studentNumber; }
    public void setStudentNumber(String studentNumber) { this.studentNumber = studentNumber; }
    public Integer getEnrollmentYear() { return enrollmentYear; }
    public void setEnrollmentYear(Integer enrollmentYear) { this.enrollmentYear = enrollmentYear; }
    public String getProgram() { return program; }
    public void setProgram(String program) { this.program = program; }
    public Integer getYearOfStudy() { return yearOfStudy; }
    public void setYearOfStudy(Integer yearOfStudy) { this.yearOfStudy = yearOfStudy; }
}
