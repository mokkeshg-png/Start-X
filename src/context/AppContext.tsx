import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  Team,
  Task,
  Discussion,
  DocumentItem,
  CollaborationGap,
  AIInsight,
  CollaborationRequest,
  NotificationItem,
  ActivityLog,
  CollegeBrandingConfig,
  TaskStatus,
  UserRole
} from '../types';
import { INITIAL_USERS, INITIAL_BRANDING } from '../mock/initialData';
import { apiService } from '../services/apiService';

interface ToastInfo {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  currentUser: User;
  setCurrentUserRole: (role: UserRole) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  brandingConfig: CollegeBrandingConfig;
  setBrandingConfig: React.Dispatch<React.SetStateAction<CollegeBrandingConfig>>;
  
  teams: Team[];
  activeTeamId: string;
  setActiveTeamId: (id: string) => void;
  getActiveTeam: () => Team | undefined;
  
  tasks: Task[];
  discussions: Discussion[];
  documents: DocumentItem[];
  gaps: CollaborationGap[];
  insights: AIInsight[];
  requests: CollaborationRequest[];
  notifications: NotificationItem[];
  activityLogs: ActivityLog[];
  
  isLoading: boolean;
  toasts: ToastInfo[];
  showToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  
  // Actions
  refreshData: () => Promise<void>;
  seedDemoData: () => Promise<void>;
  resetData: () => Promise<void>;
  createTeam: (teamData: Parameters<typeof apiService.createTeam>[0]) => Promise<Team>;
  createTask: (taskData: Parameters<typeof apiService.createTask>[0]) => Promise<Task>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  sendMessage: (discussionId: string, text: string) => Promise<void>;
  uploadDocument: (doc: Parameters<typeof apiService.uploadDocument>[0]) => Promise<void>;
  resolveGap: (gapId: string) => Promise<void>;
  runAIAnalysis: (teamId: string) => Promise<void>;
  sendCollaborationRequest: (req: Parameters<typeof apiService.sendCollaborationRequest>[0]) => Promise<void>;
  respondCollaborationRequest: (id: string, status: 'Accepted' | 'Rejected') => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  
  // Modals & Panels
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isAIAssistantOpen: boolean;
  setIsAIAssistantOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Default Staff Coordinator
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [brandingConfig, setBrandingConfig] = useState<CollegeBrandingConfig>(INITIAL_BRANDING);
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string>('team-alpha');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [gaps, setGaps] = useState<CollaborationGap[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);

  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const showToast = (title: string, description?: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const setCurrentUserRole = (role: UserRole) => {
    const targetUser = INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
    setCurrentUser(targetUser);
    showToast(`Switched Demo Persona`, `Now acting as ${targetUser.name} (${targetUser.role.replace('_', ' ')})`, 'success');
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [tList, taskList, gapList, insightList, reqList, notifList, logList] = await Promise.all([
        apiService.getTeams(currentUser),
        apiService.getTasks(),
        apiService.getCollaborationGaps(),
        apiService.getAIInsights(),
        apiService.getCollaborationRequests(),
        apiService.getNotifications(),
        apiService.getActivityLogs()
      ]);
      setTeams(tList);
      setTasks(taskList);
      setGaps(gapList);
      setInsights(insightList);
      setRequests(reqList);
      setNotifications(notifList);
      setActivityLogs(logList);

      if (activeTeamId) {
        const [discList, docList] = await Promise.all([
          apiService.getDiscussions(activeTeamId),
          apiService.getDocuments(activeTeamId)
        ]);
        setDiscussions(discList);
        setDocuments(docList);
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [activeTeamId, currentUser]);

  const getActiveTeam = () => {
    return teams.find((t) => t.id === activeTeamId);
  };

  const seedDemoData = async () => {
    await apiService.seedInitialDemoData();
    showToast("Loaded Sample Demo Records", "Populated sample teams and sprint telemetry for demonstration.", "info");
    await refreshData();
  };

  const resetData = async () => {
    await apiService.resetAllData();
    showToast("Application Reset", "All runtime business records purged. System is now empty.", "warning");
    await refreshData();
  };

  const createTeam = async (teamData: Parameters<typeof apiService.createTeam>[0]) => {
    const newTeam = await apiService.createTeam(teamData);
    setTeams((prev) => [newTeam, ...prev]);
    setActiveTeamId(newTeam.id);
    showToast("Team Created Successfully", `Project '${newTeam.projectTitle}' registered on platform.`, 'success');
    await refreshData();
    return newTeam;
  };

  const createTask = async (taskData: Parameters<typeof apiService.createTask>[0]) => {
    const newTask = await apiService.createTask(taskData);
    setTasks((prev) => [newTask, ...prev]);
    showToast("Task Created", `Assigned task '${newTask.title}'`, 'success');
    await refreshData();
    return newTask;
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    await apiService.updateTaskStatus(id, status);
    showToast("Task Updated", `Status changed to ${status}`, 'info');
    await refreshData();
  };

  const sendMessage = async (discussionId: string, text: string) => {
    await apiService.sendMessage(discussionId, text, {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      role: currentUser.role
    });
    if (activeTeamId) {
      const updatedDiscussions = await apiService.getDiscussions(activeTeamId);
      setDiscussions(updatedDiscussions);
    }
  };

  const uploadDocument = async (doc: Parameters<typeof apiService.uploadDocument>[0]) => {
    await apiService.uploadDocument(doc);
    showToast("Document Uploaded", `File '${doc.name}' indexed and verified by AI.`, 'success');
    if (activeTeamId) {
      const updatedDocs = await apiService.getDocuments(activeTeamId);
      setDocuments(updatedDocs);
    }
    await refreshData();
  };

  const resolveGap = async (gapId: string) => {
    await apiService.resolveGap(gapId);
    showToast("Gap Resolved", "Collaboration gap status updated & team health recalculated.", 'success');
    await refreshData();
  };

  const runAIAnalysis = async (teamId: string) => {
    await apiService.runAIAnalysis(teamId);
    showToast("AI Analysis Complete", "Generated latest project state breakdown and alerts.", 'success');
    await refreshData();
  };

  const sendCollaborationRequest = async (req: Parameters<typeof apiService.sendCollaborationRequest>[0]) => {
    await apiService.sendCollaborationRequest(req);
    showToast("Request Sent", `Collaboration invite sent to target student.`, 'success');
    await refreshData();
  };

  const respondCollaborationRequest = async (id: string, status: 'Accepted' | 'Rejected') => {
    await apiService.respondCollaborationRequest(id, status);
    showToast(`Request ${status}`, `Team membership updated.`, 'info');
    await refreshData();
  };

  const markNotificationRead = async (id: string) => {
    await apiService.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUserRole,
        theme,
        setTheme,
        brandingConfig,
        setBrandingConfig,
        teams,
        activeTeamId,
        setActiveTeamId,
        getActiveTeam,
        tasks,
        discussions,
        documents,
        gaps,
        insights,
        requests,
        notifications,
        activityLogs,
        isLoading,
        toasts,
        showToast,
        removeToast,
        refreshData,
        seedDemoData,
        resetData,
        createTeam,
        createTask,
        updateTaskStatus,
        sendMessage,
        uploadDocument,
        resolveGap,
        runAIAnalysis,
        sendCollaborationRequest,
        respondCollaborationRequest,
        markNotificationRead,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isAIAssistantOpen,
        setIsAIAssistantOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
