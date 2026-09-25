package com.startx.service;

import com.startx.dto.*;
import com.startx.entity.*;
import com.startx.repository.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class TeamService {
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamRoleRepository teamRoleRepository;
    private final TeamRequirementRepository teamRequirementRepository;
    private final CompatibilityAnalysisRepository compatibilityAnalysisRepository;

    public TeamService(TeamRepository teamRepository, TeamMemberRepository teamMemberRepository, TeamRoleRepository teamRoleRepository, TeamRequirementRepository teamRequirementRepository, CompatibilityAnalysisRepository compatibilityAnalysisRepository) {
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.teamRoleRepository = teamRoleRepository;
        this.teamRequirementRepository = teamRequirementRepository;
        this.compatibilityAnalysisRepository = compatibilityAnalysisRepository;
    }

    // Teams
    public List<TeamDto> getAllTeams() {
        return teamRepository.findAll().stream().map(this::mapTeamToDto).collect(Collectors.toList());
    }

    public Optional<TeamDto> getTeamById(UUID id) {
        return teamRepository.findById(id).map(this::mapTeamToDto);
    }

    public TeamDto createTeam(TeamDto dto) {
        Team t = new Team();
        t.setTeamName(dto.getTeamName());
        t.setProblemStatement(dto.getProblemStatement());
        t.setDescription(dto.getDescription());
        t.setLeaderId(dto.getLeaderId());
        t.setCreatedBy(dto.getCreatedBy());
        t.setDepartmentId(dto.getDepartmentId());
        t.setStatus(dto.getStatus() != null ? dto.getStatus() : "draft");
        t.setMaxMembers(dto.getMaxMembers() != null ? dto.getMaxMembers() : 6);
        t.setMetadata(dto.getMetadata() != null ? dto.getMetadata() : "{}");
        return mapTeamToDto(teamRepository.save(t));
    }

    public Optional<TeamDto> updateTeam(UUID id, TeamDto dto) {
        return teamRepository.findById(id).map(t -> {
            t.setTeamName(dto.getTeamName());
            t.setProblemStatement(dto.getProblemStatement());
            t.setDescription(dto.getDescription());
            t.setLeaderId(dto.getLeaderId());
            t.setDepartmentId(dto.getDepartmentId());
            t.setStatus(dto.getStatus());
            t.setMaxMembers(dto.getMaxMembers());
            t.setMetadata(dto.getMetadata());
            return mapTeamToDto(teamRepository.save(t));
        });
    }

    public void deleteTeam(UUID id) {
        teamRepository.deleteById(id);
    }

    // Members
    public List<TeamMemberDto> getTeamMembers(UUID teamId) {
        return teamMemberRepository.findByTeamId(teamId).stream().map(this::mapMemberToDto).collect(Collectors.toList());
    }

    public TeamMemberDto addTeamMember(UUID teamId, TeamMemberDto dto) {
        Optional<TeamMember> existing = teamMemberRepository.findByTeamIdAndStudentId(teamId, dto.getStudentId());
        if (existing.isPresent()) {
            throw new IllegalArgumentException("User is already a member of this team");
        }
        TeamMember m = new TeamMember();
        m.setTeamId(teamId);
        m.setStudentId(dto.getStudentId());
        m.setRole(dto.getRole());
        return mapMemberToDto(teamMemberRepository.save(m));
    }

    public void removeTeamMember(UUID teamId, UUID studentId) {
        teamMemberRepository.findByTeamIdAndStudentId(teamId, studentId).ifPresent(teamMemberRepository::delete);
    }

    // Roles
    public List<TeamRoleDto> getTeamRoles(UUID teamId) {
        return teamRoleRepository.findByTeamId(teamId).stream().map(this::mapRoleToDto).collect(Collectors.toList());
    }

    public TeamRoleDto assignTeamRole(UUID teamId, TeamRoleDto dto) {
        TeamRole r = new TeamRole();
        r.setTeamId(teamId);
        r.setRoleName(dto.getRoleName());
        r.setDescription(dto.getDescription());
        r.setRequiredSkills(dto.getRequiredSkills() != null ? dto.getRequiredSkills() : "[]");
        r.setIsFilled(dto.getIsFilled() != null ? dto.getIsFilled() : false);
        r.setFilledBy(dto.getFilledBy());
        return mapRoleToDto(teamRoleRepository.save(r));
    }

    // Requirements
    public List<TeamRequirementDto> getTeamRequirements(UUID teamId) {
        return teamRequirementRepository.findByTeamId(teamId).stream().map(this::mapRequirementToDto).collect(Collectors.toList());
    }

    public TeamRequirementDto createRequirement(UUID teamId, TeamRequirementDto dto) {
        TeamRequirement r = new TeamRequirement();
        r.setTeamId(teamId);
        r.setRequirement(dto.getRequirement());
        r.setCategory(dto.getCategory());
        r.setPriority(dto.getPriority());
        return mapRequirementToDto(teamRequirementRepository.save(r));
    }

    // Compatibility
    public List<CompatibilityAnalysisDto> getCompatibilityAnalysis(UUID teamId) {
        return compatibilityAnalysisRepository.findByTeamId(teamId).stream().map(this::mapCompatibilityToDto).collect(Collectors.toList());
    }

    public CompatibilityAnalysisDto saveCompatibilityAnalysis(UUID teamId, CompatibilityAnalysisDto dto) {
        CompatibilityAnalysis c = new CompatibilityAnalysis();
        c.setTeamId(teamId);
        c.setRequiredSkills(dto.getRequiredSkills());
        c.setCoveredSkills(dto.getCoveredSkills());
        c.setMissingSkills(dto.getMissingSkills());
        c.setCompatibilityScore(dto.getCompatibilityScore());
        c.setAiReasoning(dto.getAiReasoning());
        return mapCompatibilityToDto(compatibilityAnalysisRepository.save(c));
    }


    // Mappers
    private TeamDto mapTeamToDto(Team t) {
        TeamDto d = new TeamDto();
        d.setTeamId(t.getTeamId());
        d.setTeamName(t.getTeamName());
        d.setProblemStatement(t.getProblemStatement());
        d.setDescription(t.getDescription());
        d.setLeaderId(t.getLeaderId());
        d.setCreatedBy(t.getCreatedBy());
        d.setDepartmentId(t.getDepartmentId());
        d.setStatus(t.getStatus());
        d.setMaxMembers(t.getMaxMembers());
        d.setMetadata(t.getMetadata());
        if (t.getCreatedAt() != null) d.setCreatedAt(t.getCreatedAt().toString());
        return d;
    }

    private TeamMemberDto mapMemberToDto(TeamMember m) {
        TeamMemberDto d = new TeamMemberDto();
        d.setMemberId(m.getMemberId());
        d.setTeamId(m.getTeamId());
        d.setStudentId(m.getStudentId());
        d.setRole(m.getRole());
        d.setIsActive(m.getIsActive());
        if (m.getJoinedAt() != null) d.setJoinedAt(m.getJoinedAt().toString());
        return d;
    }

    private TeamRoleDto mapRoleToDto(TeamRole r) {
        TeamRoleDto d = new TeamRoleDto();
        d.setRoleId(r.getRoleId());
        d.setTeamId(r.getTeamId());
        d.setRoleName(r.getRoleName());
        d.setDescription(r.getDescription());
        d.setRequiredSkills(r.getRequiredSkills());
        d.setIsFilled(r.getIsFilled());
        d.setFilledBy(r.getFilledBy());
        if (r.getCreatedAt() != null) d.setCreatedAt(r.getCreatedAt().toString());
        return d;
    }

    private TeamRequirementDto mapRequirementToDto(TeamRequirement r) {
        TeamRequirementDto d = new TeamRequirementDto();
        d.setRequirementId(r.getRequirementId());
        d.setTeamId(r.getTeamId());
        d.setRequirement(r.getRequirement());
        d.setCategory(r.getCategory());
        d.setPriority(r.getPriority());
        d.setIsMet(r.getIsMet());
        return d;
    }

    private CompatibilityAnalysisDto mapCompatibilityToDto(CompatibilityAnalysis c) {
        CompatibilityAnalysisDto d = new CompatibilityAnalysisDto();
        d.setAnalysisId(c.getAnalysisId());
        d.setTeamId(c.getTeamId());
        d.setRequiredSkills(c.getRequiredSkills());
        d.setCoveredSkills(c.getCoveredSkills());
        d.setMissingSkills(c.getMissingSkills());
        d.setCompatibilityScore(c.getCompatibilityScore());
        d.setAiReasoning(c.getAiReasoning());
        return d;
    }
}
