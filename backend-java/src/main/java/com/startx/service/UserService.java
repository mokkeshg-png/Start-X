package com.startx.service;

import com.startx.dto.UserDto;
import com.startx.entity.*;
import com.startx.repository.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StaffRepository staffRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final SkillRepository skillRepository;

    public UserService(UserRepository userRepository,
                       StudentRepository studentRepository,
                       StaffRepository staffRepository,
                       StudentProfileRepository studentProfileRepository,
                       SkillRepository skillRepository) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.staffRepository = staffRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.skillRepository = skillRepository;
    }

    public Optional<UserDto> getUserById(UUID userId) {
        return userRepository.findById(userId)
                .map(this::mapToDto);
    }

    private UserDto mapToDto(User user) {
        String role = mapRole(user.getRole());
        
        UserDto dto = new UserDto();
        dto.setId(user.getUserId().toString());
        dto.setName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setAvatar(user.getAvatarUrl() != null ? user.getAvatarUrl() : "");
        dto.setRole(role);
        dto.setCreatedAt(user.getCreatedAt().toString());
        
        if ("STUDENT".equals(role)) {
            studentRepository.findByUserId(user.getUserId()).ifPresent(student -> {
                if (student.getDepartment() != null) {
                    dto.setDepartment(student.getDepartment().getName());
                }
                dto.setYear(student.getYearOfStudy() != null ? student.getYearOfStudy().toString() : "");
                dto.setStudentId(student.getStudentNumber());
                
                studentProfileRepository.findByStudentId(student.getStudentId()).ifPresent(profile -> {
                    dto.setBio(profile.getBio());
                    dto.setGithub(profile.getGithubUrl());
                    dto.setLinkedin(profile.getLinkedinUrl());
                    
                    List<Skill> skills = skillRepository.findByProfileId(profile.getProfileId());
                    dto.setSkills(skills.stream().map(Skill::getSkillName).collect(Collectors.toList()));
                    
                    dto.setProfileComplete(profile.getBio() != null && !profile.getBio().isEmpty());
                });
            });
        } else if ("TEACHER".equals(role)) {
            staffRepository.findByUserId(user.getUserId()).ifPresent(staff -> {
                if (staff.getDepartment() != null) {
                    dto.setDepartment(staff.getDepartment().getName());
                }
                dto.setBio(staff.getSpecialization());
                dto.setProfileComplete(staff.getSpecialization() != null && !staff.getSpecialization().isEmpty());
            });
        }
        
        if (dto.getDepartment() == null) dto.setDepartment("");
        if (dto.getProfileComplete() == null) dto.setProfileComplete(false);
        
        return dto;
    }

    private String mapRole(String dbRole) {
        if (dbRole == null) return "STUDENT";
        return switch (dbRole.toLowerCase()) {
            case "admin" -> "ADMIN";
            case "staff", "department_head" -> "TEACHER";
            case "student" -> "STUDENT";
            default -> "STUDENT";
        };
    }
}
