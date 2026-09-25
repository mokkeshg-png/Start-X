// ============================================================
// FINAL ROLE MODEL: Only 3 system-level authentication roles
// "Team Leader" is a project-scoped assignment, NOT a login role
// ============================================================
export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

// ============================================================
// Authorized Email — Admin adds these before registration
// ============================================================
export type EmailApprovalStatus = 'NOT_REGISTERED' | 'REGISTERED' | 'ACTIVE';

export interface AuthorizedEmail {
  id: string;
  email: string;
  role: 'TEACHER' | 'STUDENT';
  addedAt: string;
  status: EmailApprovalStatus;
  userId?: string; // linked after registration
}

// ============================================================
// User — Base model for all authenticated users
// ============================================================
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  department: string;
  year?: string; // Students only
  bio?: string;
  skills?: string[];
  github?: string;
  linkedin?: string;
  studentId?: string; // Auto-generated unique ID for students
  profileComplete?: boolean;
  createdAt: string;
}

// ============================================================
// Project — Created by Teacher
// ============================================================
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'FINALIZED' | 'COMPLETED';

export interface Project {
  id: string; // Auto-generated unique project ID (PRJ-XXXXXXXX)
  name: string;
  description: string;
  problemStatement: string;
  category: string;
  projectType: string;
  duration: string;
  requiredSkills: string[];
  status: ProjectStatus;
  teacherId: string; // owning teacher
  teamLeaderId?: string; // student ID assigned as team leader
  memberIds: string[]; // student IDs
  memberRoles: Record<string, string>; // studentId -> role name
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Project Document — PRD / requirement docs uploaded by Teacher
// ============================================================
export type DocType = 'PDF' | 'DOCX' | 'PPTX' | 'ZIP' | 'Code' | 'Markdown' | 'Image' | 'Other';

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  type: DocType;
  size: string;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
  // File reference — in frontend-only mode, store data URL or file metadata
  fileRef?: string;
  // Analysis status
  analysisAvailable: boolean;
  analysisNote?: string;
}

// ============================================================
// Student Contribution — Real uploads by students
// ============================================================
export interface StudentContribution {
  id: string;
  projectId: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  fileName?: string;
  fileRef?: string;
  fileSize?: string;
  uploadedAt: string;
  updatedAt: string;
}

// ============================================================
// Student Profile — Extended profile information
// ============================================================
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
  evidenceType: string;
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

// ============================================================
// AI Analysis — Project + Team compatibility
// ============================================================
export interface AIAnalysisResult {
  id: string;
  projectId: string;
  timestamp: string;
  // Project requirements derived from documents + description
  derivedRequirements: string[];
  requiredSkills: string[];
  requiredRoles: string[];
  // Coverage
  coveredSkills: string[];
  missingSkills: string[];
  coveredRoles: string[];
  missingRoles: string[];
  duplicateRoles: string[];
  // Scores
  requirementCoverage: number; // 0-100
  roleAlignment: number; // 0-100
  skillEvidenceCoverage: number; // 0-100
  overallCompatibility: number; // 0-100
  // Per-member analysis
  memberAnalysis: {
    studentId: string;
    studentName: string;
    assignedRole: string;
    matchingSkills: string[];
    missingSkills: string[];
    evidenceStrength: number;
    roleMatch: boolean;
  }[];
  // Explanations
  explanations: string[];
  risks: string[];
  recommendations: string[];
  // Label for local analysis
  analysisType: 'LOCAL_DETERMINISTIC' | 'AI_SERVICE';
}

// ============================================================
// Notifications
// ============================================================
export interface NotificationItem {
  id: string;
  userId: string; // target user
  title: string;
  description: string;
  category: 'PROJECT_ASSIGNMENT' | 'ROLE_CHANGE' | 'TEAM_UPDATE' | 'MESSAGE' | 'SYSTEM';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  projectId?: string;
  projectName?: string;
}

// ============================================================
// Messages — Team Chat / Direct / Mentor
// ============================================================
export type MessageChannelType = 'TEAM_CHAT' | 'DIRECT' | 'MENTOR';

export interface Message {
  id: string;
  channelType: MessageChannelType;
  channelId: string; // projectId for TEAM_CHAT, or constructed ID for DM/mentor
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  recipientId?: string; // for DM/mentor messages
}

// ============================================================
// Collaboration Request
// ============================================================
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

// ============================================================
// Activity Log
// ============================================================
export interface ActivityLog {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  object: string;
  timestamp: string;
  projectId?: string;
}

// ============================================================
// College Branding
// ============================================================
export interface CollegeBrandingConfig {
  collegeName: string;
  collegeShortName: string;
  platformName: string;
  tagline: string;
  logoText: string;
  primaryColor: string;
  accentColor: string;
}
