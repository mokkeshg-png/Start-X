package com.startx.service;

import com.startx.dto.UserDto;
import com.startx.entity.*;
import com.startx.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * User management service for the Start-X platform.
 *
 * <p>Handles both retrieval (for /api/v1/auth/me responses) and provisioning
 * (creating the users + students/staff records for a newly authorized user
 * registering for the first time).</p>
 *
 * <p>Role mapping (DB → Application):</p>
 * <pre>
 *   DB user_role_type   →  Application role
 *   student             →  STUDENT
 *   staff               →  TEACHER
 *   department_head     →  TEACHER
 *   admin               →  ADMIN
 * </pre>
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository            userRepository;
    private final StudentRepository         studentRepository;
    private final StaffRepository           staffRepository;
    private final StudentProfileRepository  studentProfileRepository;
    private final SkillRepository           skillRepository;

    public UserService(UserRepository userRepository,
                       StudentRepository studentRepository,
                       StaffRepository staffRepository,
                       StudentProfileRepository studentProfileRepository,
                       SkillRepository skillRepository) {
        this.userRepository           = userRepository;
        this.studentRepository        = studentRepository;
        this.staffRepository          = staffRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.skillRepository          = skillRepository;
    }

    // =========================================================================
    // READ
    // =========================================================================

    public Optional<UserDto> getUserById(UUID userId) {
        return userRepository.findById(userId).map(this::mapToDto);
    }

    public Optional<UserDto> getUserByEmail(String email) {
        return userRepository.findByEmail(email).map(this::mapToDto);
    }

    // =========================================================================
    // WRITE (direct / internal)
    // =========================================================================

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    // =========================================================================
    // PROVISIONING — called from AuthController on first login
    // =========================================================================

    /**
     * Idempotently provision an application user record for a Supabase Auth user.
     *
     * <p>Safe to call multiple times — will not create duplicates. If a users
     * record already exists for the given UUID it is returned immediately.
     * Otherwise a new record is created using the authorized role from the
     * {@code authorized_emails} table. Depending on the role a {@code students}
     * or {@code staff} child record is also created.</p>
     *
     * @param supabaseUserId  Supabase auth.users UUID (used as users.user_id PK)
     * @param email           Verified email from the JWT
     * @param fullName        Display name (from user_metadata or email prefix)
     * @param dbRole          DB-level role: student | staff | admin
     * @return the provisioned (or pre-existing) UserDto
     */
    @Transactional
    public UserDto provisionUser(UUID supabaseUserId, String email, String fullName, String dbRole) {
        // 1. Check if already provisioned
        Optional<User> existing = userRepository.findById(supabaseUserId);
        if (existing.isPresent()) {
            log.debug("User {} already provisioned, returning existing record", supabaseUserId);
            // Update last login marker by re-fetching (no explicit column yet; just return)
            return mapToDto(existing.get());
        }

        // 2. Check by email in case UUID changed (edge case: same user, different session)
        Optional<User> byEmail = userRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            log.debug("User found by email {}, updating UUID reference", email);
            return mapToDto(byEmail.get());
        }

        // 3. Create users record
        User user = new User();
        user.setUserId(supabaseUserId);
        user.setEmail(email);
        user.setFullName(fullName != null && !fullName.isBlank() ? fullName : email.split("@")[0]);
        user.setRole(dbRole);          // DB enum string: 'student', 'staff', 'admin'
        user.setIsActive(true);
        userRepository.save(user);
        log.info("Provisioned users record for {} ({})", email, dbRole);

        // 4. Create role-specific child record
        switch (dbRole.toLowerCase()) {
            case "student" -> provisionStudent(supabaseUserId);
            case "staff", "department_head" -> provisionStaff(supabaseUserId);
            case "admin" -> { /* admins have no extra child record */ }
            default -> log.warn("Unknown dbRole '{}' — no child record created", dbRole);
        }

        return mapToDto(userRepository.findById(supabaseUserId).orElse(user));
    }

    // -------------------------------------------------------------------------
    // Private provisioning helpers
    // -------------------------------------------------------------------------

    private void provisionStudent(UUID userId) {
        // Guard: do not double-create
        if (studentRepository.findByUserId(userId).isPresent()) {
            return;
        }
        Student s = new Student();
        s.setStudentId(UUID.randomUUID());
        s.setUserId(userId);
        s.setEnrollmentYear(Year.now().getValue());
        studentRepository.save(s);
        log.info("Provisioned students record for userId={}", userId);
    }

    private void provisionStaff(UUID userId) {
        if (staffRepository.findByUserId(userId).isPresent()) {
            return;
        }
        Staff st = new Staff();
        st.setStaffId(UUID.randomUUID());
        st.setUserId(userId);
        staffRepository.save(st);
        log.info("Provisioned staff record for userId={}", userId);
    }

    // =========================================================================
    // DTO mapping
    // =========================================================================

    private UserDto mapToDto(User user) {
        String appRole = mapRole(user.getRole());

        UserDto dto = new UserDto();
        dto.setId(user.getUserId().toString());
        dto.setName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setAvatar(user.getAvatarUrl() != null ? user.getAvatarUrl() : "");
        dto.setRole(appRole);
        dto.setCreatedAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");

        // Enrich with role-specific data
        if ("STUDENT".equals(appRole)) {
            studentRepository.findByUserId(user.getUserId()).ifPresent(student -> {
                if (student.getDepartment() != null) {
                    dto.setDepartment(student.getDepartment().getName());
                }
                dto.setYear(student.getYearOfStudy() != null
                        ? student.getYearOfStudy().toString() : "");
                dto.setStudentId(student.getStudentNumber());

                studentProfileRepository.findByStudentId(student.getStudentId()).ifPresent(profile -> {
                    dto.setBio(profile.getBio());
                    dto.setGithub(profile.getGithubUrl());
                    dto.setLinkedin(profile.getLinkedinUrl());

                    List<Skill> skills = skillRepository.findByProfileId(profile.getProfileId());
                    dto.setSkills(skills.stream()
                            .map(Skill::getSkillName)
                            .collect(Collectors.toList()));

                    dto.setProfileComplete(profile.getBio() != null && !profile.getBio().isEmpty());
                });
            });
        } else if ("TEACHER".equals(appRole)) {
            staffRepository.findByUserId(user.getUserId()).ifPresent(staff -> {
                if (staff.getDepartment() != null) {
                    dto.setDepartment(staff.getDepartment().getName());
                }
                dto.setBio(staff.getSpecialization());
                dto.setProfileComplete(
                        staff.getSpecialization() != null && !staff.getSpecialization().isEmpty());
            });
        }

        // Default nulls to empty strings
        if (dto.getDepartment()    == null) dto.setDepartment("");
        if (dto.getProfileComplete() == null) dto.setProfileComplete(false);

        return dto;
    }

    /**
     * Maps DB user_role_type → application role string used throughout the frontend.
     */
    public static String mapRole(String dbRole) {
        if (dbRole == null) return "STUDENT";
        return switch (dbRole.toLowerCase()) {
            case "admin"                       -> "ADMIN";
            case "staff", "department_head"    -> "TEACHER";
            case "student"                     -> "STUDENT";
            default                            -> "STUDENT";
        };
    }
}
