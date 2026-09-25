import {
  Team,
  Task,
  Discussion,
  DocumentItem,
  CollaborationGap,
  AIInsight,
  StudentProfile,
  MemberContribution,
  CollaborationRequest,
  NotificationItem,
  ActivityLog,
  User,
  CollegeBrandingConfig
} from '../types';

import { INITIAL_BRANDING, INITIAL_USERS } from '../mock/initialData';

const KEYS = {
  BRANDING: 'apex_branding_v2',
  USERS: 'apex_users_v2',
  TEAMS: 'apex_teams_v2',
  TASKS: 'apex_tasks_v2',
  DISCUSSIONS: 'apex_discussions_v2',
  DOCUMENTS: 'apex_documents_v2',
  GAPS: 'apex_gaps_v2',
  INSIGHTS: 'apex_insights_v2',
  PROFILES: 'apex_profiles_v2',
  REQUESTS: 'apex_requests_v2',
  NOTIFICATIONS: 'apex_notifications_v2',
  LOGS: 'apex_logs_v2'
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

  // System Configuration (Starts with default branding & system users)
  getBranding(): CollegeBrandingConfig {
    return this.getStorage<CollegeBrandingConfig>(KEYS.BRANDING, INITIAL_BRANDING);
  }

  saveBranding(config: CollegeBrandingConfig): void {
    this.setStorage(KEYS.BRANDING, config);
  }

  getUsers(): User[] {
    return this.getStorage<User[]>(KEYS.USERS, INITIAL_USERS);
  }

  saveUsers(users: User[]): void {
    this.setStorage(KEYS.USERS, users);
  }

  // Business Data Entities — Start EMPTY [] by default unless created by user!
  getTeams(): Team[] {
    return this.getStorage<Team[]>(KEYS.TEAMS, []);
  }

  saveTeams(teams: Team[]): void {
    this.setStorage(KEYS.TEAMS, teams);
  }

  getTasks(): Task[] {
    return this.getStorage<Task[]>(KEYS.TASKS, []);
  }

  saveTasks(tasks: Task[]): void {
    this.setStorage(KEYS.TASKS, tasks);
  }

  getDiscussions(): Discussion[] {
    return this.getStorage<Discussion[]>(KEYS.DISCUSSIONS, []);
  }

  saveDiscussions(discussions: Discussion[]): void {
    this.setStorage(KEYS.DISCUSSIONS, discussions);
  }

  getDocuments(): DocumentItem[] {
    return this.getStorage<DocumentItem[]>(KEYS.DOCUMENTS, []);
  }

  saveDocuments(docs: DocumentItem[]): void {
    this.setStorage(KEYS.DOCUMENTS, docs);
  }

  getGaps(): CollaborationGap[] {
    return this.getStorage<CollaborationGap[]>(KEYS.GAPS, []);
  }

  saveGaps(gaps: CollaborationGap[]): void {
    this.setStorage(KEYS.GAPS, gaps);
  }

  getInsights(): AIInsight[] {
    return this.getStorage<AIInsight[]>(KEYS.INSIGHTS, []);
  }

  saveInsights(insights: AIInsight[]): void {
    this.setStorage(KEYS.INSIGHTS, insights);
  }

  getStudentProfiles(): Record<string, StudentProfile> {
    return this.getStorage<Record<string, StudentProfile>>(KEYS.PROFILES, {});
  }

  saveStudentProfiles(profiles: Record<string, StudentProfile>): void {
    this.setStorage(KEYS.PROFILES, profiles);
  }

  getRequests(): CollaborationRequest[] {
    return this.getStorage<CollaborationRequest[]>(KEYS.REQUESTS, []);
  }

  saveRequests(reqs: CollaborationRequest[]): void {
    this.setStorage(KEYS.REQUESTS, reqs);
  }

  getNotifications(): NotificationItem[] {
    return this.getStorage<NotificationItem[]>(KEYS.NOTIFICATIONS, []);
  }

  saveNotifications(notifs: NotificationItem[]): void {
    this.setStorage(KEYS.NOTIFICATIONS, notifs);
  }

  getActivityLogs(): ActivityLog[] {
    return this.getStorage<ActivityLog[]>(KEYS.LOGS, []);
  }

  saveActivityLogs(logs: ActivityLog[]): void {
    this.setStorage(KEYS.LOGS, logs);
  }

  // Developer Reset Mechanism — Purges all business records back to 0
  resetAllBusinessData(): void {
    Object.values(KEYS).forEach((k) => {
      if (k !== KEYS.BRANDING && k !== KEYS.USERS) {
        localStorage.removeItem(k);
      }
    });
  }
}

export const clientStorage = new ClientStorage();
