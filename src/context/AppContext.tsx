import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  AuthorizedEmail,
  Project,
  ProjectDocument,
  StudentContribution,
  AIAnalysisResult,
  NotificationItem,
  Message,
  CollaborationRequest,
  ActivityLog,
  CollegeBrandingConfig
} from '../types';
import { INITIAL_BRANDING } from '../mock/initialData';
import { apiService } from '../services/apiService';
import { authService, LoginCredentials, RegisterPayload } from '../services/authService';
import { clientStorage } from '../storage/clientStorage';
import { supabase } from '../lib/supabase';

interface ToastInfo {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  brandingConfig: CollegeBrandingConfig;
  setBrandingConfig: React.Dispatch<React.SetStateAction<CollegeBrandingConfig>>;

  // Data
  projects: Project[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  getActiveProject: () => Project | undefined;

  authorizedEmails: AuthorizedEmail[];
  projectDocuments: ProjectDocument[];
  contributions: StudentContribution[];
  notifications: NotificationItem[];
  messages: Message[];
  requests: CollaborationRequest[];
  activityLogs: ActivityLog[];
  aiAnalysis?: AIAnalysisResult;

  isLoading: boolean;
  toasts: ToastInfo[];
  showToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;

  // Actions
  refreshData: () => Promise<void>;
  resetData: () => Promise<void>;

  // Project Actions
  createProject: (data: Parameters<typeof apiService.createProject>[0]) => Promise<Project>;
  updateProject: (id: string, updates: Parameters<typeof apiService.updateProject>[1]) => Promise<Project>;
  finalizeProject: (id: string) => Promise<Project>;
  uploadProjectDocument: (projectId: string, data: Parameters<typeof apiService.uploadProjectDocument>[1]) => Promise<ProjectDocument>;
  deleteProjectDocument: (docId: string) => Promise<boolean>;

  // Student Actions
  addStudentContribution: (data: Parameters<typeof apiService.addStudentContribution>[0]) => Promise<StudentContribution>;
  updateStudentContribution: (id: string, updates: { title?: string; description?: string }) => Promise<StudentContribution>;
  deleteStudentContribution: (id: string) => Promise<boolean>;
  updateUserProfile: (updates: Partial<User>) => Promise<User>;

  // AI & Analytics
  runAIAnalysis: (projectId: string) => Promise<AIAnalysisResult>;

  // Admin Actions
  addAuthorizedEmail: (email: string, role: 'TEACHER' | 'STUDENT') => Promise<AuthorizedEmail>;
  bulkAddAuthorizedEmails: (emails: string[], role: 'TEACHER' | 'STUDENT') => Promise<{ added: number; skipped: number }>;
  removeAuthorizedEmail: (id: string) => Promise<boolean>;

  // Social & Communications
  sendMessage: (channelType: Message['channelType'], channelId: string, text: string, recipientId?: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  sendCollaborationRequest: (params: Omit<Parameters<typeof apiService.sendCollaborationRequest>[0], 'sender'>) => Promise<void>;
  respondCollaborationRequest: (id: string, status: 'Accepted' | 'Rejected') => Promise<void>;

  // Modals & Panels
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isAIAssistantOpen: boolean;
  setIsAIAssistantOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Current authenticated user from real session
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    return clientStorage.getCurrentUser();
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [brandingConfig, setBrandingConfig] = useState<CollegeBrandingConfig>(() => {
    // Restore persisted branding config from localStorage
    try {
      const stored = localStorage.getItem('startx_branding_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.collegeName) return parsed as CollegeBrandingConfig;
      }
    } catch { /* ignore */ }
    return INITIAL_BRANDING;
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [authorizedEmails, setAuthorizedEmails] = useState<AuthorizedEmail[]>([]);
  const [projectDocuments, setProjectDocuments] = useState<ProjectDocument[]>([]);
  const [contributions, setContributions] = useState<StudentContribution[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | undefined>(undefined);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);

  const setCurrentUser = (u: User | null) => {
    setCurrentUserState(u);
    // Only persist the session user — not business data
    clientStorage.saveCurrentUser(u);
  };

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      setCurrentUserState(response.user);
      showToast('Authentication Successful', `Welcome back, ${response.user.name}!`, 'success');
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.register(payload);
      setCurrentUserState(response.user);
      showToast('Registration Successful', `Account created for ${response.user.name}.`, 'success');
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setCurrentUserState(null);
    setProjects([]);
    setAuthorizedEmails([]);
    setNotifications([]);
    setMessages([]);
    setRequests([]);
    setActivityLogs([]);
    setProjectDocuments([]);
    setContributions([]);
    setAiAnalysis(undefined);
    showToast('Signed Out', 'You have been securely signed out.', 'info');
  };

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

  // Session verification on mount
  useEffect(() => {
    let mounted = true;
    authService.getCurrentUser().then((user) => {
      if (mounted) {
        setCurrentUserState(user);
      }
    }).catch(() => {
      if (mounted) {
        setCurrentUserState(null);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Supabase Realtime — subscribe to new notifications for the current user
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel(`notifications:${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const n = payload.new as Record<string, unknown>;
          const newNotif: NotificationItem = {
            id: n.notification_id as string,
            userId: currentUser.id,
            title: n.title as string,
            description: (n.body as string) || '',
            category: 'SYSTEM',
            timestamp: n.created_at as string,
            read: false,
            actionUrl: (n.data as any)?.action_url,
            projectId: (n.data as any)?.project_id,
            projectName: (n.data as any)?.project_name,
          };
          setNotifications((prev) => [newNotif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  const refreshData = async () => {
    if (!currentUser) {
      setProjects([]);
      setAuthorizedEmails([]);
      setNotifications([]);
      setRequests([]);
      setActivityLogs([]);
      setProjectDocuments([]);
      setContributions([]);
      return;
    }

    setIsLoading(true);
    try {
      const [projList, notifList, reqList] = await Promise.all([
        apiService.getProjects(currentUser),
        apiService.getNotifications(currentUser.id),
        apiService.getCollaborationRequests(currentUser.id),
      ]);

      setProjects(projList);
      setNotifications(notifList);
      setRequests(reqList);

      // Admin: load authorized emails
      if (currentUser.role === 'ADMIN' || currentUser.role === 'TEACHER') {
        const authList = await apiService.getAuthorizedEmails();
        setAuthorizedEmails(authList);
      }

      // Load activity logs for admins/teachers
      if (currentUser.role !== 'STUDENT') {
        const logs = await apiService.getActivityLogs();
        setActivityLogs(logs);
      }

      const targetProjectId = activeProjectId || (projList.length > 0 ? projList[0].id : '');
      if (targetProjectId) {
        const [docs, contribs] = await Promise.all([
          apiService.getProjectDocuments(targetProjectId),
          apiService.getStudentContributions(targetProjectId),
        ]);
        setProjectDocuments(docs);
        setContributions(contribs);
      } else {
        setProjectDocuments([]);
        setContributions([]);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [activeProjectId, currentUser?.id, currentUser?.role]);

  const getActiveProject = () => {
    return projects.find((p) => p.id === activeProjectId);
  };

  // ============================================================
  // ACTIONS
  // ============================================================
  const createProject = async (data: Parameters<typeof apiService.createProject>[0]) => {
    const newProject = await apiService.createProject(data);
    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    showToast('Project Created', `Project '${newProject.name}' (ID: ${newProject.id}) created.`, 'success');
    await refreshData();
    return newProject;
  };

  const updateProject = async (id: string, updates: Parameters<typeof apiService.updateProject>[1]) => {
    if (!currentUser) throw new Error('Unauthenticated');
    const updated = await apiService.updateProject(id, updates, currentUser.id);
    showToast('Project Updated', `Changes to '${updated.name}' saved.`, 'success');
    await refreshData();
    return updated;
  };

  const finalizeProject = async (id: string) => {
    if (!currentUser) throw new Error('Unauthenticated');
    const finalized = await apiService.finalizeProject(id, currentUser.id);
    showToast('Project Finalized', `Assigned students notified and team activated.`, 'success');
    await refreshData();
    return finalized;
  };

  const uploadProjectDocument = async (projectId: string, data: Parameters<typeof apiService.uploadProjectDocument>[1]) => {
    const doc = await apiService.uploadProjectDocument(projectId, data);
    showToast('Document Uploaded', `'${doc.name}' uploaded and processed.`, 'success');
    await refreshData();
    return doc;
  };

  const deleteProjectDocument = async (docId: string) => {
    if (!currentUser) throw new Error('Unauthenticated');
    const ok = await apiService.deleteProjectDocument(docId, currentUser.id);
    if (ok) {
      showToast('Document Deleted', 'Requirement file removed.', 'info');
      await refreshData();
    }
    return ok;
  };

  const addStudentContribution = async (data: Parameters<typeof apiService.addStudentContribution>[0]) => {
    const contrib = await apiService.addStudentContribution(data);
    showToast('Submission Uploaded', `Work '${contrib.title}' logged to project.`, 'success');
    await refreshData();
    return contrib;
  };

  const updateStudentContribution = async (id: string, updates: { title?: string; description?: string }) => {
    if (!currentUser) throw new Error('Unauthenticated');
    const contrib = await apiService.updateStudentContribution(id, currentUser.id, updates);
    showToast('Submission Updated', `Contribution updated.`, 'info');
    await refreshData();
    return contrib;
  };

  const deleteStudentContribution = async (id: string) => {
    if (!currentUser) throw new Error('Unauthenticated');
    const ok = await apiService.deleteStudentContribution(id, currentUser.id);
    if (ok) {
      showToast('Submission Removed', 'Your contribution was deleted.', 'info');
      await refreshData();
    }
    return ok;
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) throw new Error('Unauthenticated');
    const updated = await apiService.updateUserProfile(currentUser.id, updates);
    setCurrentUser(updated);
    showToast('Profile Updated', 'Your profile details have been saved.', 'success');
    return updated;
  };

  const runAIAnalysis = async (projectId: string) => {
    const res = await apiService.runProjectAIAnalysis(projectId);
    setAiAnalysis(res);
    showToast('AI Analysis Completed', `Compatibility evaluated: ${res.overallCompatibility}%`, 'success');
    return res;
  };

  const addAuthorizedEmail = async (email: string, role: 'TEACHER' | 'STUDENT') => {
    const record = await apiService.addAuthorizedEmail(email, role);
    showToast('Email Authorized', `${email} added to allowed ${role.toLowerCase()}s.`, 'success');
    await refreshData();
    return record;
  };

  const bulkAddAuthorizedEmails = async (emails: string[], role: 'TEACHER' | 'STUDENT') => {
    const res = await apiService.bulkAddAuthorizedEmails(emails, role);
    showToast('Bulk Authorization Complete', `Added ${res.added} emails (${res.skipped} duplicates skipped).`, 'success');
    await refreshData();
    return res;
  };

  const removeAuthorizedEmail = async (id: string) => {
    const ok = await apiService.removeAuthorizedEmail(id);
    if (ok) {
      showToast('Authorization Revoked', 'Email removed from authorized list.', 'info');
      await refreshData();
    }
    return ok;
  };

  const sendMessage = async (channelType: Message['channelType'], channelId: string, text: string, recipientId?: string) => {
    if (!currentUser) throw new Error('Unauthenticated');
    await apiService.sendMessage({
      channelType,
      channelId,
      sender: currentUser,
      text,
      recipientId
    });
    const updated = await apiService.getMessages(channelType, channelId);
    setMessages(updated);
  };

  const markNotificationRead = async (id: string) => {
    await apiService.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const sendCollaborationRequest = async (params: Omit<Parameters<typeof apiService.sendCollaborationRequest>[0], 'sender'>) => {
    if (!currentUser) throw new Error('Unauthenticated');
    await apiService.sendCollaborationRequest({
      ...params,
      sender: currentUser
    });
    showToast('Invite Sent', 'Collaboration invitation sent.', 'success');
    await refreshData();
  };

  const respondCollaborationRequest = async (id: string, status: 'Accepted' | 'Rejected') => {
    await apiService.respondToCollaborationRequest(id, status);
    showToast(`Request ${status}`, 'Response recorded.', 'info');
    await refreshData();
  };

  const resetData = async () => {
    await apiService.resetAllData();
    showToast('Cache Cleared', 'Local session cache has been cleared.', 'warning');
    await refreshData();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        register,
        logout,
        theme,
        setTheme,
        brandingConfig,
        setBrandingConfig,
        projects,
        activeProjectId,
        setActiveProjectId,
        getActiveProject,
        authorizedEmails,
        projectDocuments,
        contributions,
        notifications,
        messages,
        requests,
        activityLogs,
        aiAnalysis,
        isLoading,
        toasts,
        showToast,
        removeToast,
        refreshData,
        resetData,
        createProject,
        updateProject,
        finalizeProject,
        uploadProjectDocument,
        deleteProjectDocument,
        addStudentContribution,
        updateStudentContribution,
        deleteStudentContribution,
        updateUserProfile,
        runAIAnalysis,
        addAuthorizedEmail,
        bulkAddAuthorizedEmails,
        removeAuthorizedEmail,
        sendMessage,
        markNotificationRead,
        sendCollaborationRequest,
        respondCollaborationRequest,
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
