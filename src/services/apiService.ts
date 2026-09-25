import {
  Team,
  Task,
  Discussion,
  DiscussionMessage,
  DocumentItem,
  KnowledgeNode,
  KnowledgeEdge,
  CollaborationGap,
  AIInsight,
  StudentProfile,
  MemberContribution,
  CollaborationRequest,
  NotificationItem,
  ActivityLog,
  TeammateRecommendation,
  TaskStatus,
  User
} from '../types';

import { clientStorage } from '../storage/clientStorage';
import { aiEngine } from './aiEngine';
import {
  INITIAL_TEAMS,
  INITIAL_TASKS,
  INITIAL_DISCUSSIONS,
  INITIAL_DOCUMENTS,
  INITIAL_KNOWLEDGE_NODES,
  INITIAL_KNOWLEDGE_EDGES,
  INITIAL_GAPS,
  INITIAL_AI_INSIGHTS,
  INITIAL_STUDENT_PROFILES,
  INITIAL_CONTRIBUTIONS,
  INITIAL_COLLABORATION_REQUESTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_USERS
} from '../mock/initialData';

const simulatedDelay = (ms = 120) => new Promise((res) => setTimeout(res, ms));

class ApiService {
  // Developer Seeding Helper — Populates sample data if explicitly invoked by developer/demo button
  async seedInitialDemoData(): Promise<void> {
    clientStorage.saveTeams(INITIAL_TEAMS);
    clientStorage.saveTasks(INITIAL_TASKS);
    clientStorage.saveDiscussions(INITIAL_DISCUSSIONS);
    clientStorage.saveDocuments(INITIAL_DOCUMENTS);
    clientStorage.saveGaps(INITIAL_GAPS);
    clientStorage.saveInsights(INITIAL_AI_INSIGHTS);
    clientStorage.saveStudentProfiles(INITIAL_STUDENT_PROFILES);
    clientStorage.saveRequests(INITIAL_COLLABORATION_REQUESTS);
    clientStorage.saveNotifications(INITIAL_NOTIFICATIONS);
    clientStorage.saveActivityLogs(INITIAL_ACTIVITY_LOGS);
  }

  // Clear / Reset Mechanism — Returns system to empty state
  async resetAllData(): Promise<void> {
    clientStorage.resetAllBusinessData();
  }

  // Teams API
  async getTeams(user?: { id: string; role: string }): Promise<Team[]> {
    await simulatedDelay();
    const teams = clientStorage.getTeams();
    if (!user) return teams;
    if (user.role === 'STAFF_COORDINATOR' || user.role === 'DEPARTMENT_HEAD') {
      return teams;
    }
    // Student scope filtering
    return teams.filter((t) => t.memberIds.includes(user.id) || t.leaderId === user.id);
  }

  async getTeam(id: string, user?: { id: string; role: string }): Promise<Team | undefined> {
    await simulatedDelay();
    const teams = clientStorage.getTeams();
    const team = teams.find((t) => t.id === id);
    if (!team) return undefined;
    if (!user) return team;

    if (user.role === 'STAFF_COORDINATOR' || user.role === 'DEPARTMENT_HEAD') {
      return team;
    }
    if (team.memberIds.includes(user.id) || team.leaderId === user.id) {
      return team;
    }
    return undefined;
  }

  async createTeam(data: Omit<Team, 'id' | 'createdAt' | 'healthScore' | 'progress' | 'healthBreakdown' | 'activeTasksCount' | 'openGapsCount' | 'lastActivity'>): Promise<Team> {
    await simulatedDelay(250);
    const teams = clientStorage.getTeams();
    const newTeam: Team = {
      ...data,
      id: `team-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      progress: 0,
      healthScore: 85,
      healthBreakdown: {
        contribution: 80,
        progress: 10,
        collaboration: 90,
        communication: 85,
        documentation: 50,
        dependencies: 100
      },
      activeTasksCount: 0,
      openGapsCount: 0,
      lastActivity: "Just now"
    };

    teams.unshift(newTeam);
    clientStorage.saveTeams(teams);

    const logs = clientStorage.getActivityLogs();
    logs.unshift({
      id: `log-${Date.now()}`,
      actorName: "Team Leader / Staff",
      actorRole: "User",
      action: "Created Team",
      object: newTeam.name,
      timestamp: "Just now",
      teamId: newTeam.id
    });
    clientStorage.saveActivityLogs(logs);

    return newTeam;
  }

  // Tasks API
  async getTasks(teamId?: string): Promise<Task[]> {
    await simulatedDelay();
    const tasks = clientStorage.getTasks();
    if (teamId) {
      return tasks.filter((t) => t.teamId === teamId);
    }
    return tasks;
  }

  async createTask(taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    await simulatedDelay(200);
    const tasks = clientStorage.getTasks();
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    tasks.unshift(newTask);
    clientStorage.saveTasks(tasks);

    // Recalculate team task count and progress
    const teams = clientStorage.getTeams();
    const team = teams.find((t) => t.id === newTask.teamId);
    if (team) {
      const teamTasks = tasks.filter((t) => t.teamId === newTask.teamId);
      const completed = teamTasks.filter((t) => t.status === 'Completed').length;
      team.activeTasksCount = teamTasks.length;
      team.progress = teamTasks.length > 0 ? Math.round((completed / teamTasks.length) * 100) : 0;
      team.lastActivity = "Just now";
      clientStorage.saveTeams(teams);
    }

    return newTask;
  }

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    await simulatedDelay(150);
    const tasks = clientStorage.getTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error("Task not found");
    task.status = status;
    clientStorage.saveTasks(tasks);

    // Update team metrics
    const teams = clientStorage.getTeams();
    const team = teams.find((t) => t.id === task.teamId);
    if (team) {
      const teamTasks = tasks.filter((t) => t.teamId === task.teamId);
      const completed = teamTasks.filter((t) => t.status === 'Completed').length;
      team.progress = teamTasks.length > 0 ? Math.round((completed / teamTasks.length) * 100) : 0;
      team.lastActivity = "Just now";
      clientStorage.saveTeams(teams);
    }

    return task;
  }

  // Discussions API
  async getDiscussions(teamId: string): Promise<Discussion[]> {
    await simulatedDelay();
    const discussions = clientStorage.getDiscussions();
    return discussions.filter((d) => d.teamId === teamId);
  }

  async sendMessage(discussionId: string, text: string, sender: { id: string; name: string; avatar: string; role: string }): Promise<DiscussionMessage> {
    await simulatedDelay(200);
    const discussions = clientStorage.getDiscussions();
    const discussion = discussions.find((d) => d.id === discussionId);
    if (!discussion) throw new Error("Discussion not found");

    const newMsg: DiscussionMessage = {
      id: `msg-${Date.now()}`,
      discussionId,
      senderId: sender.id,
      senderName: sender.name,
      senderAvatar: sender.avatar,
      senderRole: sender.role,
      text,
      timestamp: "Just now"
    };

    discussion.messages.push(newMsg);
    discussion.messageCount += 1;
    discussion.lastActivity = "Just now";
    clientStorage.saveDiscussions(discussions);

    return newMsg;
  }

  // Documents API
  async getDocuments(teamId: string): Promise<DocumentItem[]> {
    await simulatedDelay();
    const docs = clientStorage.getDocuments();
    return docs.filter((d) => d.teamId === teamId);
  }

  async uploadDocument(docData: Omit<DocumentItem, 'id' | 'uploadedAt' | 'aiStatus'>): Promise<DocumentItem> {
    await simulatedDelay(300);
    const docs = clientStorage.getDocuments();
    const newDoc: DocumentItem = {
      ...docData,
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0],
      aiStatus: "MATCH",
      aiAnalysisNote: "Document successfully indexed and verified."
    };
    docs.unshift(newDoc);
    clientStorage.saveDocuments(docs);

    return newDoc;
  }

  // Collaboration Gaps API
  async getCollaborationGaps(teamId?: string): Promise<CollaborationGap[]> {
    await simulatedDelay();
    const gaps = clientStorage.getGaps();
    if (teamId) {
      return gaps.filter((g) => g.teamId === teamId);
    }
    return gaps;
  }

  async resolveGap(gapId: string): Promise<CollaborationGap> {
    await simulatedDelay(200);
    const gaps = clientStorage.getGaps();
    const gap = gaps.find((g) => g.id === gapId);
    if (!gap) throw new Error("Gap not found");
    gap.status = "Resolved";
    clientStorage.saveGaps(gaps);

    const teams = clientStorage.getTeams();
    const team = teams.find((t) => t.id === gap.teamId);
    if (team) {
      team.openGapsCount = Math.max(0, team.openGapsCount - 1);
      team.healthScore = Math.min(100, team.healthScore + 5);
      clientStorage.saveTeams(teams);
    }

    return gap;
  }

  // AI Insights API (Dynamic Execution via aiEngine)
  async getAIInsights(teamId?: string): Promise<AIInsight[]> {
    await simulatedDelay();
    const insights = clientStorage.getInsights();
    if (teamId) {
      return insights.filter((i) => i.teamId === teamId);
    }
    return insights;
  }

  async runAIAnalysis(teamId: string): Promise<AIInsight[]> {
    await simulatedDelay(600);
    const teams = clientStorage.getTeams();
    const tasks = clientStorage.getTasks();
    const discussions = clientStorage.getDiscussions();
    const docs = clientStorage.getDocuments();

    const team = teams.find((t) => t.id === teamId);
    if (!team) return [];

    const dynamicInsights = aiEngine.generateCollectiveInsights(team, tasks, discussions, docs);
    const insights = clientStorage.getInsights();

    dynamicInsights.forEach((di) => insights.unshift(di));
    clientStorage.saveInsights(insights);

    return insights.filter((i) => i.teamId === teamId);
  }

  // Teammate Recommendations (Dynamic calculation)
  async getTeammateRecommendations(prompt: string, targetSkills: string[]): Promise<TeammateRecommendation[]> {
    await simulatedDelay(350);
    const users = clientStorage.getUsers().filter((u) => u.role === 'TEAM_MEMBER' || u.role === 'TEAM_LEADER');

    return users.map((u, idx) => {
      const uSkills = u.skills || [];
      const matched = uSkills.filter((s) => targetSkills.some((ts) => ts.toLowerCase().includes(s.toLowerCase())));
      const matchPercentage = targetSkills.length > 0 ? Math.min(98, Math.max(50, Math.round((matched.length / targetSkills.length) * 100))) : 80;

      return {
        studentId: u.id,
        name: u.name,
        avatar: u.avatar,
        department: u.department,
        skills: uSkills,
        verifiedSkills: uSkills.slice(0, 2),
        matchPercentage,
        recommendedRole: idx % 2 === 0 ? "Frontend Lead" : "Backend Developer",
        matchReasons: [
          `Verified proficiency in ${uSkills[0] || 'core technologies'}.`,
          `Verified profile telemetry on APEX platform.`
        ]
      };
    });
  }

  // Requests API
  async getCollaborationRequests(): Promise<CollaborationRequest[]> {
    await simulatedDelay();
    return clientStorage.getRequests();
  }

  async sendCollaborationRequest(req: Omit<CollaborationRequest, 'id' | 'status' | 'sentAt'>): Promise<CollaborationRequest> {
    await simulatedDelay(200);
    const reqs = clientStorage.getRequests();
    const newReq: CollaborationRequest = {
      ...req,
      id: `req-${Date.now()}`,
      status: "Pending",
      sentAt: "Just now"
    };
    reqs.unshift(newReq);
    clientStorage.saveRequests(reqs);
    return newReq;
  }

  async respondCollaborationRequest(id: string, status: 'Accepted' | 'Rejected'): Promise<CollaborationRequest> {
    await simulatedDelay(200);
    const reqs = clientStorage.getRequests();
    const req = reqs.find((r) => r.id === id);
    if (!req) throw new Error("Request not found");
    req.status = status;
    clientStorage.saveRequests(reqs);
    return req;
  }

  // Notifications & Logs
  async getNotifications(): Promise<NotificationItem[]> {
    await simulatedDelay();
    return clientStorage.getNotifications();
  }

  async markNotificationRead(id: string): Promise<void> {
    const notifs = clientStorage.getNotifications();
    const n = notifs.find((item) => item.id === id);
    if (n) {
      n.read = true;
      clientStorage.saveNotifications(notifs);
    }
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    await simulatedDelay();
    return clientStorage.getActivityLogs();
  }
}

export const apiService = new ApiService();
