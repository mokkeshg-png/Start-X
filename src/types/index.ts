export type UserRole = 'STAFF_COORDINATOR' | 'TEAM_LEADER' | 'TEAM_MEMBER' | 'DEPARTMENT_HEAD';

export interface User {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  avatar: string;
  role: UserRole;
  department: string;
  year?: string;
  bio?: string;
  skills?: string[];
  github?: string;
  linkedin?: string;
}

export type ProjectPhase = 'Planning' | 'Development' | 'Review' | 'Completed';

export interface HealthBreakdown {
  contribution: number;
  progress: number;
  collaboration: number;
  communication: number;
  documentation: number;
  dependencies: number;
}

export interface Team {
  id: string;
  name: string;
  projectTitle: string;
  problemStatement: string;
  description: string;
  category: string;
  expectedDuration: string;
  leaderId: string;
  memberIds: string[];
  memberRoles: Record<string, string>; // memberId -> role name (Frontend, Backend, etc.)
  progress: number; // 0 - 100
  healthScore: number; // 0 - 100
  status: ProjectPhase;
  createdAt: string;
  healthBreakdown: HealthBreakdown;
  activeTasksCount: number;
  openGapsCount: number;
  lastActivity: string;
}

export type TaskStatus = 'Pending' | 'Ongoing' | 'Completed' | 'Blocked';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Task {
  id: string;
  teamId: string;
  title: string;
  description: string;
  assignedToId: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  dueDate: string;
  createdAt: string;
}

export interface MessageAttachment {
  name: string;
  url: string;
  size: string;
}

export interface DiscussionMessage {
  id: string;
  discussionId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: string;
  text: string;
  timestamp: string;
  attachments?: MessageAttachment[];
}

export interface Discussion {
  id: string;
  teamId: string;
  title: string;
  topic: string;
  lastActivity: string;
  messageCount: number;
  resolved: boolean;
  messages: DiscussionMessage[];
  aiAnalysis: {
    decisions: string[];
    problems: string[];
    unresolved: string[];
    actionItems: string[];
  };
}

export type DocType = 'PDF' | 'DOCX' | 'PPTX' | 'ZIP' | 'Code' | 'Markdown';
export type DocAIStatus = 'MATCH' | 'WARNING' | 'MISMATCH';

export interface DocumentItem {
  id: string;
  teamId: string;
  name: string;
  type: DocType;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  version: string;
  url: string;
  aiStatus: DocAIStatus;
  aiAnalysisNote?: string;
  consistencyDetails?: {
    scopeItem: string;
    docItem: string;
    submittedWorkItem: string;
    status: DocAIStatus;
    issue?: string;
  }[];
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'Student' | 'Role' | 'Topic';
  role?: string;
  studentId?: string;
  exchangeCount: number;
  isIsolated?: boolean;
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  topic: string;
  count: number;
}

export type GapImpact = 'High' | 'Medium' | 'Low';
export type GapStatus = 'Open' | 'Resolved' | 'Ignored';

export interface GapRecommendation {
  actionText: string;
  reason: string;
  priority: string;
  actionType: 'assign_task' | 'notify_member' | 'resolve' | 'open_discussion';
}

export interface CollaborationGap {
  id: string;
  teamId: string;
  type: string;
  description: string;
  affectedRole: string;
  affectedMemberId: string;
  affectedMemberName: string;
  impact: GapImpact;
  detectedDate: string;
  status: GapStatus;
  recommendation: GapRecommendation;
}

export interface AIInsight {
  id: string;
  teamId: string;
  title: string;
  category: 'completed' | 'discussed' | 'learned' | 'risk' | 'dependency';
  content: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  timestamp: string;
  attribution: string;
}

export interface SkillItem {
  name: string;
  proficiency: number; // 0-100
  verificationState: 'Verified' | 'Partially Verified' | 'Unverified';
  evidenceCount: number;
}

export interface SkillEvidence {
  skillName: string;
  projectName: string;
  submittedWork: string;
  evidenceType: string; // 'GitHub Commit' | 'Code Artifact' | 'API Schema' | 'Test Suite'
  evidenceStrength: number; // 0-100
}

export interface StudentProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  repoUrl: string;
  verifiedSkills: string[];
  date: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  department: string;
  year: string;
  bio: string;
  skills: SkillItem[];
  evidenceMap: SkillEvidence[];
  projects: StudentProject[];
}

export interface ContributionDataPoint {
  week: string;
  code: number;
  docs: number;
  tasks: number;
  discussions: number;
  reviews: number;
}

export interface MemberContribution {
  studentId: string;
  studentName: string;
  role: string;
  overallScore: number;
  roleAlignment: number;
  qualityScore: number;
  activityTrend: 'Increasing' | 'Stable' | 'Decreasing' | 'Missing';
  aiNotes: string;
  weeklyHistory: ContributionDataPoint[];
}

export interface CollaborationRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  projectTitle: string;
  suggestedRole: string;
  message: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  sentAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  category: 'AI Alert' | 'Task' | 'Contribution' | 'Discussion' | 'Collaboration' | 'System';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface ActivityLog {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  object: string;
  timestamp: string;
  teamId?: string;
}

export interface TeammateRecommendation {
  studentId: string;
  name: string;
  avatar: string;
  department: string;
  skills: string[];
  verifiedSkills: string[];
  matchPercentage: number;
  recommendedRole: string;
  matchReasons: string[];
}

export interface CollegeBrandingConfig {
  collegeName: string;
  collegeShortName: string;
  platformName: string;
  tagline: string;
  logoText: string;
  primaryColor: string;
  accentColor: string;
}
