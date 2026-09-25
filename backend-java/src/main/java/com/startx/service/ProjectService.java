package com.startx.service;

import com.startx.dto.ProjectDto;
import com.startx.entity.Project;
import com.startx.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public List<ProjectDto> getAllProjects() {
        return projectRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public Optional<ProjectDto> getProjectById(UUID id) {
        return projectRepository.findById(id).map(this::mapToDto);
    }

    public ProjectDto createProject(ProjectDto dto) {
        Project p = new Project();
        p.setProfileId(dto.getProfileId());
        p.setProjectName(dto.getProjectName());
        p.setDescription(dto.getDescription());
        p.setTechnologies(dto.getTechnologies() != null ? dto.getTechnologies() : "[]");
        p.setRepositoryUrl(dto.getRepositoryUrl());
        p.setDemoUrl(dto.getDemoUrl());
        p.setFiles(dto.getFiles() != null ? dto.getFiles() : "[]");
        p.setIsFeatured(dto.getIsFeatured() != null ? dto.getIsFeatured() : false);
        return mapToDto(projectRepository.save(p));
    }

    public Optional<ProjectDto> updateProject(UUID id, ProjectDto dto) {
        return projectRepository.findById(id).map(p -> {
            p.setProjectName(dto.getProjectName());
            p.setDescription(dto.getDescription());
            p.setTechnologies(dto.getTechnologies());
            p.setRepositoryUrl(dto.getRepositoryUrl());
            p.setDemoUrl(dto.getDemoUrl());
            p.setFiles(dto.getFiles());
            p.setIsFeatured(dto.getIsFeatured());
            return mapToDto(projectRepository.save(p));
        });
    }

    public void deleteProject(UUID id) {
        projectRepository.deleteById(id);
    }

    private ProjectDto mapToDto(Project p) {
        ProjectDto d = new ProjectDto();
        d.setProjectId(p.getProjectId());
        d.setProfileId(p.getProfileId());
        d.setProjectName(p.getProjectName());
        d.setDescription(p.getDescription());
        d.setTechnologies(p.getTechnologies());
        d.setRepositoryUrl(p.getRepositoryUrl());
        d.setDemoUrl(p.getDemoUrl());
        d.setFiles(p.getFiles());
        d.setIsFeatured(p.getIsFeatured());
        if (p.getSubmittedAt() != null) {
            d.setSubmittedAt(p.getSubmittedAt().toString());
        }
        return d;
    }
}
