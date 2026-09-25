package com.startx.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "skills")
public class Skill {
    @Id
    @Column(name = "skill_id", updatable = false, nullable = false)
    private UUID skillId;

    @Column(name = "profile_id", nullable = false)
    private UUID profileId;

    @Column(name = "skill_name", nullable = false)
    private String skillName;

    @Column(name = "category")
    private String category;

    @Column(name = "proficiency_level", nullable = false)
    private String proficiencyLevel;

    public Skill() {}

    public UUID getSkillId() { return skillId; }
    public void setSkillId(UUID skillId) { this.skillId = skillId; }
    public UUID getProfileId() { return profileId; }
    public void setProfileId(UUID profileId) { this.profileId = profileId; }
    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getProficiencyLevel() { return proficiencyLevel; }
    public void setProficiencyLevel(String proficiencyLevel) { this.proficiencyLevel = proficiencyLevel; }
}
