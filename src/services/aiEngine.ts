import {
  Project,
  ProjectDocument,
  User,
  StudentProfile,
  AIAnalysisResult
} from '../types';
import { clientStorage } from '../storage/clientStorage';

/**
 * Deterministic Frontend AI Analysis Engine
 * Uses ACTUAL project requirements + student profiles + assigned roles.
 * Designed as a replaceable service interface for future backend AI integration.
 * 
 * NEVER fabricates source data.
 * Clearly labels results as LOCAL_DETERMINISTIC analysis.
 */
class AIEngine {
  /**
   * Analyze team compatibility against actual project requirements.
   * 
   * INPUTS:
   * A. Project details (description, category, type, required skills)
   * B. Uploaded PRD/project documents
   * C. Selected student profiles
   * D. Teacher-assigned roles
   * 
   * OUTPUTS:
   * - Derived requirements from project data
   * - Skill coverage analysis
   * - Role alignment analysis
   * - Evidence-based scoring
   * - Explainable results
   */
  analyzeProjectTeamCompatibility(project: Project): AIAnalysisResult {
    const allUsers = clientStorage.getUsers();
    const allProfiles = clientStorage.getStudentProfiles();
    const projectDocs = clientStorage.getProjectDocuments().filter(d => d.projectId === project.id);

    // 1. Derive requirements from project data
    const derivedRequirements = this.deriveRequirements(project, projectDocs);
    const requiredSkills = this.deriveRequiredSkills(project, derivedRequirements);
    const requiredRoles = this.deriveRequiredRoles(project, derivedRequirements);

    // 2. Analyze each team member
    const memberAnalysis = project.memberIds.map(memberId => {
      const user = allUsers.find(u => u.id === memberId);
      const profile = allProfiles[memberId];
      const assignedRole = project.memberRoles[memberId] || 'Unassigned';

      const userSkills = new Set<string>();
      if (user?.skills) user.skills.forEach(s => userSkills.add(s.toLowerCase()));
      if (profile?.skills) profile.skills.forEach(s => userSkills.add(s.name.toLowerCase()));

      const matchingSkills = requiredSkills.filter(rs =>
        Array.from(userSkills).some(us =>
          us.includes(rs.toLowerCase()) || rs.toLowerCase().includes(us)
        )
      );

      const missingSkills = requiredSkills.filter(rs => !matchingSkills.includes(rs));

      // Evidence strength from profile
      let evidenceStrength = 0;
      if (profile?.evidenceMap && profile.evidenceMap.length > 0) {
        const relevantEvidence = profile.evidenceMap.filter(e =>
          requiredSkills.some(rs => e.skillName.toLowerCase().includes(rs.toLowerCase()) ||
            rs.toLowerCase().includes(e.skillName.toLowerCase()))
        );
        evidenceStrength = relevantEvidence.length > 0
          ? Math.round(relevantEvidence.reduce((sum, e) => sum + e.evidenceStrength, 0) / relevantEvidence.length)
          : 0;
      }

      // Check if assigned role matches a required role
      const roleMatch = requiredRoles.some(rr =>
        assignedRole.toLowerCase().includes(rr.toLowerCase()) ||
        rr.toLowerCase().includes(assignedRole.toLowerCase())
      );

      return {
        studentId: memberId,
        studentName: user?.name || 'Unknown Student',
        assignedRole,
        matchingSkills,
        missingSkills,
        evidenceStrength,
        roleMatch
      };
    });

    // 3. Calculate coverage
    const allCoveredSkills = new Set<string>();
    memberAnalysis.forEach(ma => ma.matchingSkills.forEach(s => allCoveredSkills.add(s)));
    const coveredSkills = Array.from(allCoveredSkills);
    const missingSkills = requiredSkills.filter(rs => !coveredSkills.includes(rs));

    const coveredRoles = requiredRoles.filter(rr =>
      Object.values(project.memberRoles).some(mr =>
        mr.toLowerCase().includes(rr.toLowerCase()) || rr.toLowerCase().includes(mr.toLowerCase())
      )
    );
    const missingRoles = requiredRoles.filter(rr => !coveredRoles.includes(rr));

    // Detect duplicate roles
    const roleValues = Object.values(project.memberRoles).map(r => r.toLowerCase());
    const roleCounts: Record<string, number> = {};
    roleValues.forEach(r => { roleCounts[r] = (roleCounts[r] || 0) + 1; });
    const duplicateRoles = Object.entries(roleCounts)
      .filter(([_, count]) => count > 1)
      .map(([role]) => role);

    // 4. Calculate scores
    const requirementCoverage = requiredSkills.length > 0
      ? Math.round((coveredSkills.length / requiredSkills.length) * 100)
      : 0;

    const roleAlignment = requiredRoles.length > 0
      ? Math.round((coveredRoles.length / requiredRoles.length) * 100)
      : 0;

    const avgEvidence = memberAnalysis.length > 0
      ? Math.round(memberAnalysis.reduce((sum, ma) => sum + ma.evidenceStrength, 0) / memberAnalysis.length)
      : 0;

    const overallCompatibility = Math.round(
      (requirementCoverage * 0.4) + (roleAlignment * 0.3) + (avgEvidence * 0.3)
    );

    // 5. Generate explanations
    const explanations: string[] = [];
    const risks: string[] = [];
    const recommendations: string[] = [];

    if (coveredSkills.length > 0) {
      explanations.push(`Team covers ${coveredSkills.length} of ${requiredSkills.length} required skills: ${coveredSkills.join(', ')}.`);
    }
    if (missingSkills.length > 0) {
      risks.push(`Missing skills: ${missingSkills.join(', ')}. No team member has demonstrated proficiency in these areas.`);
      recommendations.push(`Consider adding a team member with expertise in ${missingSkills[0]} to address the gap.`);
    }
    if (missingRoles.length > 0) {
      risks.push(`Missing roles: ${missingRoles.join(', ')}. These project responsibilities are not covered by any assigned member.`);
    }
    if (duplicateRoles.length > 0) {
      explanations.push(`Duplicate roles detected: ${duplicateRoles.join(', ')}. Multiple members share the same role assignment.`);
    }
    if (project.memberIds.length < 3) {
      risks.push('Team size is below recommended minimum (3 members).');
    }
    if (avgEvidence === 0) {
      explanations.push('No verified skill evidence available for team members. Consider encouraging students to complete their profiles.');
    }
    if (projectDocs.length === 0) {
      explanations.push('No project requirement documents uploaded. Analysis is based on project description and required skills only.');
    }

    memberAnalysis.forEach(ma => {
      if (!ma.roleMatch) {
        risks.push(`${ma.studentName} is assigned "${ma.assignedRole}" but their skills may not fully align with this role.`);
      }
    });

    if (overallCompatibility >= 80) {
      explanations.push('Team composition is well-balanced for the project requirements.');
    } else if (overallCompatibility >= 50) {
      recommendations.push('Team has moderate coverage. Consider addressing skill gaps before project kickoff.');
    } else {
      recommendations.push('Team has significant gaps. Restructuring or additional recruitment is recommended.');
    }

    return {
      id: `analysis-${project.id}-${Date.now()}`,
      projectId: project.id,
      timestamp: new Date().toISOString(),
      derivedRequirements,
      requiredSkills,
      requiredRoles,
      coveredSkills,
      missingSkills,
      coveredRoles,
      missingRoles,
      duplicateRoles,
      requirementCoverage,
      roleAlignment,
      skillEvidenceCoverage: avgEvidence,
      overallCompatibility,
      memberAnalysis,
      explanations,
      risks,
      recommendations,
      analysisType: 'LOCAL_DETERMINISTIC'
    };
  }

  private deriveRequirements(project: Project, docs: ProjectDocument[]): string[] {
    const reqs: string[] = [];
    const text = `${project.name} ${project.description} ${project.problemStatement} ${project.category} ${project.projectType}`.toLowerCase();

    // Derive from project text
    if (text.includes('web') || text.includes('frontend') || text.includes('full stack') || text.includes('e-commerce') || text.includes('website')) {
      reqs.push('Frontend Development');
    }
    if (text.includes('backend') || text.includes('api') || text.includes('full stack') || text.includes('server') || text.includes('e-commerce')) {
      reqs.push('Backend Development');
    }
    if (text.includes('database') || text.includes('sql') || text.includes('data') || text.includes('storage')) {
      reqs.push('Database Design');
    }
    if (text.includes('auth') || text.includes('login') || text.includes('security')) {
      reqs.push('Authentication & Security');
    }
    if (text.includes('deploy') || text.includes('devops') || text.includes('ci/cd') || text.includes('docker')) {
      reqs.push('Deployment & DevOps');
    }
    if (text.includes('ai') || text.includes('machine learning') || text.includes('ml') || text.includes('nlp')) {
      reqs.push('AI/ML Implementation');
    }
    if (text.includes('mobile') || text.includes('app')) {
      reqs.push('Mobile Development');
    }
    if (text.includes('iot') || text.includes('embedded') || text.includes('sensor')) {
      reqs.push('IoT Integration');
    }
    if (text.includes('test') || text.includes('qa') || text.includes('quality')) {
      reqs.push('Testing & QA');
    }
    if (text.includes('design') || text.includes('ui') || text.includes('ux')) {
      reqs.push('UI/UX Design');
    }

    // Add from required skills
    project.requiredSkills.forEach(skill => {
      if (!reqs.some(r => r.toLowerCase().includes(skill.toLowerCase()))) {
        reqs.push(skill);
      }
    });

    // Add from document metadata (if docs uploaded)
    if (docs.length > 0) {
      reqs.push('Documentation & PRD Compliance');
    }

    if (reqs.length === 0) {
      reqs.push('General Development');
    }

    return reqs;
  }

  private deriveRequiredSkills(project: Project, requirements: string[]): string[] {
    const skills = new Set<string>();
    const text = `${project.name} ${project.description} ${project.problemStatement} ${project.category}`.toLowerCase();

    // Map requirements to skills
    requirements.forEach(req => {
      const rl = req.toLowerCase();
      if (rl.includes('frontend')) { skills.add('React.js'); skills.add('TypeScript'); skills.add('CSS'); }
      if (rl.includes('backend')) { skills.add('Node.js'); skills.add('REST APIs'); }
      if (rl.includes('database')) { skills.add('PostgreSQL'); skills.add('Database Design'); }
      if (rl.includes('auth')) { skills.add('JWT'); skills.add('Security'); }
      if (rl.includes('deploy') || rl.includes('devops')) { skills.add('Docker'); skills.add('CI/CD'); }
      if (rl.includes('ai') || rl.includes('ml')) { skills.add('Python'); skills.add('PyTorch'); }
      if (rl.includes('mobile')) { skills.add('React Native'); }
      if (rl.includes('iot')) { skills.add('IoT Telemetry'); skills.add('Python'); }
      if (rl.includes('test') || rl.includes('qa')) { skills.add('Testing'); skills.add('Cypress'); }
      if (rl.includes('ui') || rl.includes('ux')) { skills.add('Figma'); skills.add('UI/UX'); }
    });

    // Add explicit required skills from project
    project.requiredSkills.forEach(s => skills.add(s));

    return Array.from(skills);
  }

  private deriveRequiredRoles(_project: Project, requirements: string[]): string[] {
    const roles = new Set<string>();

    requirements.forEach(req => {
      const rl = req.toLowerCase();
      if (rl.includes('frontend')) roles.add('Frontend Developer');
      if (rl.includes('backend')) roles.add('Backend Developer');
      if (rl.includes('database')) roles.add('Database Developer');
      if (rl.includes('auth') || rl.includes('security')) roles.add('Security Engineer');
      if (rl.includes('deploy') || rl.includes('devops')) roles.add('DevOps Engineer');
      if (rl.includes('ai') || rl.includes('ml')) roles.add('AI/ML Engineer');
      if (rl.includes('mobile')) roles.add('Mobile Developer');
      if (rl.includes('test') || rl.includes('qa')) roles.add('Testing / QA');
      if (rl.includes('ui') || rl.includes('ux')) roles.add('UI/UX Designer');
      if (rl.includes('documentation')) roles.add('Documentation');
    });

    if (roles.size === 0) {
      roles.add('Developer');
    }

    return Array.from(roles);
  }
}

export const aiEngine = new AIEngine();
