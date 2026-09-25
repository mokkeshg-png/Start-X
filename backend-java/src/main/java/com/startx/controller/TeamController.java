package com.startx.controller;

import com.startx.dto.*;
import com.startx.service.TeamService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamDto>>> getAllTeams() {
        return ResponseEntity.ok(ApiResponse.success(teamService.getAllTeams()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamDto>> getTeamById(@PathVariable UUID id) {
        return teamService.getTeamById(id)
                .map(dto -> ResponseEntity.ok(ApiResponse.success(dto)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TeamDto>> createTeam(
            @RequestBody TeamDto dto,
            Authentication authentication) {
        TeamDto created = teamService.createTeam(dto);
        return ResponseEntity.ok(ApiResponse.success("Team created", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamDto>> updateTeam(
            @PathVariable UUID id,
            @RequestBody TeamDto dto,
            Authentication authentication) {
        return teamService.updateTeam(id, dto)
                .map(updated -> ResponseEntity.ok(ApiResponse.success("Team updated", updated)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTeam(
            @PathVariable UUID id,
            Authentication authentication) {
        teamService.deleteTeam(id);
        return ResponseEntity.ok(ApiResponse.success("Team deleted", null));
    }

    // Members
    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<TeamMemberDto>>> getTeamMembers(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamMembers(id)));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<TeamMemberDto>> addTeamMember(
            @PathVariable UUID id,
            @RequestBody TeamMemberDto dto,
            Authentication authentication) {
        try {
            TeamMemberDto member = teamService.addTeamMember(id, dto);
            return ResponseEntity.ok(ApiResponse.success("Member added", member));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @DeleteMapping("/{id}/members/{studentId}")
    public ResponseEntity<ApiResponse<Void>> removeTeamMember(
            @PathVariable UUID id,
            @PathVariable UUID studentId,
            Authentication authentication) {
        teamService.removeTeamMember(id, studentId);
        return ResponseEntity.ok(ApiResponse.success("Member removed", null));
    }

    // Roles
    @GetMapping("/{id}/roles")
    public ResponseEntity<ApiResponse<List<TeamRoleDto>>> getTeamRoles(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamRoles(id)));
    }

    @PostMapping("/{id}/roles")
    public ResponseEntity<ApiResponse<TeamRoleDto>> assignTeamRole(
            @PathVariable UUID id,
            @RequestBody TeamRoleDto dto,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(teamService.assignTeamRole(id, dto)));
    }

    // Requirements
    @GetMapping("/{id}/requirements")
    public ResponseEntity<ApiResponse<List<TeamRequirementDto>>> getTeamRequirements(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamRequirements(id)));
    }

    @PostMapping("/{id}/requirements")
    public ResponseEntity<ApiResponse<TeamRequirementDto>> addTeamRequirement(
            @PathVariable UUID id,
            @RequestBody TeamRequirementDto dto,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(teamService.createRequirement(id, dto)));
    }

    // Compatibility
    @GetMapping("/{id}/compatibility")
    public ResponseEntity<ApiResponse<List<CompatibilityAnalysisDto>>> getCompatibility(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getCompatibilityAnalysis(id)));
    }

    @PostMapping("/{id}/compatibility")
    public ResponseEntity<ApiResponse<CompatibilityAnalysisDto>> addCompatibility(
            @PathVariable UUID id,
            @RequestBody CompatibilityAnalysisDto dto,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(teamService.saveCompatibilityAnalysis(id, dto)));
    }
}
