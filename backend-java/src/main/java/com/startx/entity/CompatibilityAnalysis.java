package com.startx.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "compatibility_analysis")
public class CompatibilityAnalysis {

    @Id
    @Column(name = "analysis_id", updatable = false, nullable = false)
    private UUID analysisId;

    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @Column(name = "required_skills", nullable = false, columnDefinition = "text")
    private String requiredSkills;

    @Column(name = "covered_skills", nullable = false, columnDefinition = "text")
    private String coveredSkills;

    @Column(name = "missing_skills", nullable = false, columnDefinition = "text")
    private String missingSkills;

    @Column(name = "compatibility_score")
    private BigDecimal compatibilityScore;

    @Column(name = "ai_reasoning", nullable = false, columnDefinition = "text")
    private String aiReasoning;

    @Column(name = "analyzed_at", nullable = false, updatable = false)
    private ZonedDateTime analyzedAt;

    public CompatibilityAnalysis() {
    }

    @PrePersist
    protected void onCreate() {
        if (analysisId == null) analysisId = UUID.randomUUID();
        if (analyzedAt == null) analyzedAt = ZonedDateTime.now();
        if (requiredSkills == null) requiredSkills = "[]";
        if (coveredSkills == null) coveredSkills = "[]";
        if (missingSkills == null) missingSkills = "[]";
        if (aiReasoning == null) aiReasoning = "{}";
    }

    public UUID getAnalysisId() { return analysisId; }
    public void setAnalysisId(UUID analysisId) { this.analysisId = analysisId; }

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) { this.teamId = teamId; }

    public String getRequiredSkills() { return requiredSkills; }
    public void setRequiredSkills(String requiredSkills) { this.requiredSkills = requiredSkills; }

    public String getCoveredSkills() { return coveredSkills; }
    public void setCoveredSkills(String coveredSkills) { this.coveredSkills = coveredSkills; }

    public String getMissingSkills() { return missingSkills; }
    public void setMissingSkills(String missingSkills) { this.missingSkills = missingSkills; }

    public BigDecimal getCompatibilityScore() { return compatibilityScore; }
    public void setCompatibilityScore(BigDecimal compatibilityScore) { this.compatibilityScore = compatibilityScore; }

    public String getAiReasoning() { return aiReasoning; }
    public void setAiReasoning(String aiReasoning) { this.aiReasoning = aiReasoning; }

    public ZonedDateTime getAnalyzedAt() { return analyzedAt; }
    public void setAnalyzedAt(ZonedDateTime analyzedAt) { this.analyzedAt = analyzedAt; }
}
