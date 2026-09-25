package com.startx.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class CompatibilityAnalysisDto {
    private UUID analysisId;
    private UUID teamId;
    private String requiredSkills;
    private String coveredSkills;
    private String missingSkills;
    private BigDecimal compatibilityScore;
    private String aiReasoning;

    public CompatibilityAnalysisDto() {}

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
}
