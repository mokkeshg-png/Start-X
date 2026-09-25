package com.startx.repository;

import com.startx.entity.CompatibilityAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CompatibilityAnalysisRepository extends JpaRepository<CompatibilityAnalysis, UUID> {
    List<CompatibilityAnalysis> findByTeamId(UUID teamId);
}
