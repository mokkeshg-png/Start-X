import {
  Team,
  Task,
  Discussion,
  DocumentItem,
  CollaborationGap,
  AIInsight,
  User,
  StudentProfile
} from '../types';

export interface AICompatibilityReport {
  compatibilityScore: number;
  requiredSkills: string[];
  coveredSkills: string[];
  missingSkills: string[];
  roleCoverage: Record<string, boolean>;
  riskAreas: string[];
  recommendationText: string;
}

class AIEngine {
  // 1. Dynamic Team Compatibility Analysis Engine
  analyzeTeamCompatibility(
    projectTitle: string,
    problemStatement: string,
    category: string,
    memberIds: string[],
    memberRoles: Record<string, string>,
    allUsers: User[],
    allProfiles: Record<string, StudentProfile>
  ): AICompatibilityReport {
    // Determine required skills based on project specifications
    const requiredSkillsSet = new Set<string>();
    const lowerText = `${projectTitle} ${problemStatement} ${category}`.toLowerCase();

    if (lowerText.includes('web') || lowerText.includes('frontend') || lowerText.includes('full stack') || lowerText.includes('e-commerce')) {
      requiredSkillsSet.add('React.js');
      requiredSkillsSet.add('TypeScript');
      requiredSkillsSet.add('Tailwind CSS');
    }
    if (lowerText.includes('backend') || lowerText.includes('api') || lowerText.includes('full stack') || lowerText.includes('e-commerce') || lowerText.includes('server')) {
      requiredSkillsSet.add('Node.js');
      requiredSkillsSet.add('REST APIs');
    }
    if (lowerText.includes('database') || lowerText.includes('sql') || lowerText.includes('postgres') || lowerText.includes('data') || lowerText.includes('e-commerce')) {
      requiredSkillsSet.add('PostgreSQL');
    }
    if (lowerText.includes('ai') || lowerText.includes('machine learning') || lowerText.includes('python') || lowerText.includes('nlp')) {
      requiredSkillsSet.add('Python');
      requiredSkillsSet.add('PyTorch');
    }
    if (lowerText.includes('iot') || lowerText.includes('embedded') || lowerText.includes('sensor')) {
      requiredSkillsSet.add('IoT Telemetry');
      requiredSkillsSet.add('Python');
    }

    if (requiredSkillsSet.size === 0) {
      requiredSkillsSet.add('Frontend');
      requiredSkillsSet.add('Backend');
      requiredSkillsSet.add('Database');
    }

    const requiredSkills = Array.from(requiredSkillsSet);

    // Collect all actual skills from assigned team members
    const availableSkillsSet = new Set<string>();
    memberIds.forEach((mId) => {
      const u = allUsers.find((user) => user.id === mId);
      if (u && u.skills) {
        u.skills.forEach((sk) => availableSkillsSet.add(sk));
      }
      const prof = allProfiles[mId];
      if (prof && prof.skills) {
        prof.skills.forEach((sk) => availableSkillsSet.add(sk.name));
      }
    });

    const coveredSkills: string[] = [];
    const missingSkills: string[] = [];

    requiredSkills.forEach((reqSk) => {
      let isCovered = false;
      availableSkillsSet.forEach((avSk) => {
        if (avSk.toLowerCase().includes(reqSk.toLowerCase()) || reqSk.toLowerCase().includes(avSk.toLowerCase())) {
          isCovered = true;
        }
      });
      if (isCovered) {
        coveredSkills.push(reqSk);
      } else {
        missingSkills.push(reqSk);
      }
    });

    const compatibilityScore = requiredSkills.length > 0
      ? Math.round((coveredSkills.length / requiredSkills.length) * 100)
      : 80;

    const riskAreas: string[] = [];
    if (missingSkills.length > 0) {
      riskAreas.push(`Missing core expertise in ${missingSkills.join(', ')}.`);
    }
    if (memberIds.length < 3) {
      riskAreas.push('Team headcount is below recommended minimum (3 members).');
    }

    let recommendationText = 'Team skill coverage is well-balanced across all required technical domains.';
    if (missingSkills.length > 0) {
      recommendationText = `Consider recruiting a student with verified experience in ${missingSkills[0]} to mitigate technical risk.`;
    }

    const roleCoverage: Record<string, boolean> = {
      Frontend: Object.values(memberRoles).some((r) => r.toLowerCase().includes('frontend') || r.toLowerCase().includes('ui')),
      Backend: Object.values(memberRoles).some((r) => r.toLowerCase().includes('backend')),
      Database: Object.values(memberRoles).some((r) => r.toLowerCase().includes('database') || r.toLowerCase().includes('sql')),
      QA: Object.values(memberRoles).some((r) => r.toLowerCase().includes('qa') || r.toLowerCase().includes('testing'))
    };

    return {
      compatibilityScore,
      requiredSkills,
      coveredSkills,
      missingSkills,
      roleCoverage,
      riskAreas,
      recommendationText
    };
  }

  // 2. Dynamic Collaboration Gap Detection Engine
  detectGaps(team: Team, tasks: Task[], discussions: Discussion[]): CollaborationGap[] {
    const gaps: CollaborationGap[] = [];

    // Gap Rule 1: Blocked Tasks
    const blockedTasks = tasks.filter((t) => t.teamId === team.id && t.status === 'Blocked');
    blockedTasks.forEach((bt) => {
      gaps.push({
        id: `gap-bt-${bt.id}`,
        teamId: team.id,
        type: `Task Bottleneck: ${bt.title}`,
        description: `Task '${bt.title}' is currently marked Blocked, halting dependent sprint progress.`,
        affectedRole: bt.category || 'Developer',
        affectedMemberId: bt.assignedToId,
        affectedMemberName: 'Assigned Member',
        impact: bt.priority === 'Critical' ? 'High' : 'Medium',
        detectedDate: new Date().toISOString().split('T')[0],
        status: 'Open',
        recommendation: {
          actionText: `Unblock task '${bt.title}'`,
          reason: `Resolving dependency on task #${bt.id} will restore velocity.`,
          priority: bt.priority === 'Critical' ? 'High' : 'Medium',
          actionType: 'assign_task'
        }
      });
    });

    // Gap Rule 2: Unresolved Discussions
    const unresolvedDiscussions = discussions.filter((d) => d.teamId === team.id && !d.resolved);
    if (unresolvedDiscussions.length > 2) {
      gaps.push({
        id: `gap-disc-${team.id}`,
        teamId: team.id,
        type: 'Unresolved Architecture Discussions',
        description: `Team ${team.name} has ${unresolvedDiscussions.length} unresolved discussion threads requiring coordinator guidance.`,
        affectedRole: 'Team Leader',
        affectedMemberId: team.leaderId,
        affectedMemberName: 'Team Leader',
        impact: 'Medium',
        detectedDate: new Date().toISOString().split('T')[0],
        status: 'Open',
        recommendation: {
          actionText: 'Review and resolve technical discussions',
          reason: 'Aligning team architecture choices reduces scope friction.',
          priority: 'Medium',
          actionType: 'open_discussion'
        }
      });
    }

    return gaps;
  }

  // 3. Dynamic Collective AI Insights Generator
  generateCollectiveInsights(team: Team, tasks: Task[], discussions: Discussion[], docs: DocumentItem[]): AIInsight[] {
    const insights: AIInsight[] = [];
    const teamTasks = tasks.filter((t) => t.teamId === team.id);
    const completedTasks = teamTasks.filter((t) => t.status === 'Completed');
    const progressPct = teamTasks.length > 0 ? Math.round((completedTasks.length / teamTasks.length) * 100) : team.progress;

    insights.push({
      id: `ins-prog-${team.id}`,
      teamId: team.id,
      title: `Sprint Phase Execution: ${team.name}`,
      category: 'completed',
      content: `Team ${team.name} is currently at ${progressPct}% sprint task completion with ${completedTasks.length} of ${teamTasks.length} tasks completed.`,
      severity: progressPct >= 70 ? 'success' : progressPct >= 40 ? 'info' : 'warning',
      timestamp: 'Just now',
      attribution: 'AI Dynamic Telemetry Engine • Review Recommended'
    });

    const blocked = teamTasks.filter((t) => t.status === 'Blocked');
    if (blocked.length > 0) {
      insights.push({
        id: `ins-block-${team.id}`,
        teamId: team.id,
        title: 'Task Dependency Bottleneck',
        category: 'dependency',
        content: `Identified ${blocked.length} blocked task(s): ${blocked.map((b) => b.title).join(', ')}. Immediate unblocking recommended.`,
        severity: 'critical',
        timestamp: 'Just now',
        attribution: 'AI Task Dependency Analyzer'
      });
    }

    return insights;
  }
}

export const aiEngine = new AIEngine();
