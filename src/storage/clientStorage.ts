import {
  User,
  Project,
  ProjectDocument,
  StudentContribution,
  StudentProfile,
  NotificationItem,
  Message,
  CollaborationRequest,
  ActivityLog,
  AuthorizedEmail,
  AIAnalysisResult,
  CollegeBrandingConfig
} from '../types';

import { INITIAL_BRANDING } from '../mock/initialData';

const KEYS = {
  BRANDING: 'startx_branding_v3',
  CURRENT_USER: 'startx_current_user_v3',
  USERS: 'startx_users_v3',
  AUTHORIZED_EMAILS: 'startx_authorized_emails_v3',
  PROJECTS: 'startx_projects_v3',
  PROJECT_DOCUMENTS: 'startx_project_documents_v3',
  CONTRIBUTIONS: 'startx_contributions_v3',
  PROFILES: 'startx_profiles_v3',
  NOTIFICATIONS: 'startx_notifications_v3',
  MESSAGES: 'startx_messages_v3',
  REQUESTS: 'startx_requests_v3',
  LOGS: 'startx_logs_v3',
  AI_ANALYSES: 'startx_ai_analyses_v3'
};

class ClientStorage {
  private getStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return defaultValue;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
    }
  }

  // System Configuration
  getBranding(): CollegeBrandingConfig {
    const stored = this.getStorage<CollegeBrandingConfig>(KEYS.BRANDING, INITIAL_BRANDING);
    if (!stored || !stored.collegeName || stored.collegeName.includes('Apex')) {
      return INITIAL_BRANDING;
    }
    return stored;
  }

  saveBranding(config: CollegeBrandingConfig): void {
    this.setStorage(KEYS.BRANDING, config);
  }

  // Users — registered users (starts empty, created through registration)
  getUsers(): User[] {
    return this.getStorage<User[]>(KEYS.USERS, []);
  }

  saveUsers(users: User[]): void {
    this.setStorage(KEYS.USERS, users);
  }

  // Current logged-in user
  getCurrentUser(): User | null {
    return this.getStorage<User | null>(KEYS.CURRENT_USER, null);
  }

  saveCurrentUser(user: User | null): void {
    this.setStorage(KEYS.CURRENT_USER, user);
  }

  // Authorized Emails — Admin adds these
  getAuthorizedEmails(): AuthorizedEmail[] {
    return this.getStorage<AuthorizedEmail[]>(KEYS.AUTHORIZED_EMAILS, []);
  }

  saveAuthorizedEmails(emails: AuthorizedEmail[]): void {
    this.setStorage(KEYS.AUTHORIZED_EMAILS, emails);
  }

  // Projects — Teacher-created
  getProjects(): Project[] {
    return this.getStorage<Project[]>(KEYS.PROJECTS, []);
  }

  saveProjects(projects: Project[]): void {
    this.setStorage(KEYS.PROJECTS, projects);
  }

  // Project Documents
  getProjectDocuments(): ProjectDocument[] {
    return this.getStorage<ProjectDocument[]>(KEYS.PROJECT_DOCUMENTS, []);
  }

  saveProjectDocuments(docs: ProjectDocument[]): void {
    this.setStorage(KEYS.PROJECT_DOCUMENTS, docs);
  }

  // Student Contributions
  getContributions(): StudentContribution[] {
    return this.getStorage<StudentContribution[]>(KEYS.CONTRIBUTIONS, []);
  }

  saveContributions(contributions: StudentContribution[]): void {
    this.setStorage(KEYS.CONTRIBUTIONS, contributions);
  }

  // Student Profiles
  getStudentProfiles(): Record<string, StudentProfile> {
    return this.getStorage<Record<string, StudentProfile>>(KEYS.PROFILES, {});
  }

  saveStudentProfiles(profiles: Record<string, StudentProfile>): void {
    this.setStorage(KEYS.PROFILES, profiles);
  }

  // Notifications
  getNotifications(): NotificationItem[] {
    return this.getStorage<NotificationItem[]>(KEYS.NOTIFICATIONS, []);
  }

  saveNotifications(notifs: NotificationItem[]): void {
    this.setStorage(KEYS.NOTIFICATIONS, notifs);
  }

  // Messages
  getMessages(): Message[] {
    return this.getStorage<Message[]>(KEYS.MESSAGES, []);
  }

  saveMessages(messages: Message[]): void {
    this.setStorage(KEYS.MESSAGES, messages);
  }

  // Collaboration Requests
  getRequests(): CollaborationRequest[] {
    return this.getStorage<CollaborationRequest[]>(KEYS.REQUESTS, []);
  }

  saveRequests(reqs: CollaborationRequest[]): void {
    this.setStorage(KEYS.REQUESTS, reqs);
  }

  // Activity Logs
  getActivityLogs(): ActivityLog[] {
    return this.getStorage<ActivityLog[]>(KEYS.LOGS, []);
  }

  saveActivityLogs(logs: ActivityLog[]): void {
    this.setStorage(KEYS.LOGS, logs);
  }

  // AI Analyses
  getAIAnalyses(): AIAnalysisResult[] {
    return this.getStorage<AIAnalysisResult[]>(KEYS.AI_ANALYSES, []);
  }

  saveAIAnalyses(analyses: AIAnalysisResult[]): void {
    this.setStorage(KEYS.AI_ANALYSES, analyses);
  }

  // Developer Reset — Purges all business records back to 0
  resetAllBusinessData(): void {
    Object.values(KEYS).forEach((k) => {
      if (k !== KEYS.BRANDING) {
        localStorage.removeItem(k);
      }
    });
  }
}

export const clientStorage = new ClientStorage();
