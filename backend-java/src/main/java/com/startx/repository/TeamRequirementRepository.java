package com.startx.repository;

import com.startx.entity.TeamRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeamRequirementRepository extends JpaRepository<TeamRequirement, UUID> {
    List<TeamRequirement> findByTeamId(UUID teamId);
}
