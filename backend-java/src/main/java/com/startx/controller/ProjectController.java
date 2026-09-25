package com.startx.controller;

import com.startx.dto.ApiResponse;
import com.startx.dto.ProjectDto;
import com.startx.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectDto>>> getAllProjects() {
        return ResponseEntity.ok(ApiResponse.success(projectService.getAllProjects()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDto>> getProjectById(@PathVariable UUID id) {
        return projectService.getProjectById(id)
                .map(dto -> ResponseEntity.ok(ApiResponse.success(dto)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectDto>> createProject(
            @RequestBody ProjectDto dto,
            Authentication authentication) {
        // authentication checking here if needed to associate with user
        ProjectDto created = projectService.createProject(dto);
        return ResponseEntity.ok(ApiResponse.success("Project created", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDto>> updateProject(
            @PathVariable UUID id,
            @RequestBody ProjectDto dto,
            Authentication authentication) {
        return projectService.updateProject(id, dto)
                .map(updated -> ResponseEntity.ok(ApiResponse.success("Project updated", updated)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @PathVariable UUID id,
            Authentication authentication) {
        projectService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.success("Project deleted", null));
    }
}
