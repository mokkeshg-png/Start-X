import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  UserRole,
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
import { clientStorage } from '../storage/clientStorage';

export const SYSTEM_ADMIN_USER: User = {
  id: 'usr-admin-01',
  name: 'Dr. Arthur Pendelton',
  email: 'admin@apex.edu',
  role: 'ADMIN',
  department: 'Academic Administration',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArthurPendelton',
  profileComplete: true,
  createdAt: '2026-01-01T00:00:00.000Z'
};

interface ToastInfo {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: (u: User) => void;
  setCurrentUserRole: (role: UserRole) => void;
  logout: () => void;
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
  seedDemoData: () => Promise<void>;

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
  // Ensure we check storage for logged in user or default to Admin
  const [currentUser, setCurrentUserState] = useState<User>(() => {
    const saved = clientStorage.getCurrentUser();
    if (saved) return saved;
    return SYSTEM_ADMIN_USER;
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [brandingConfig, setBrandingConfig] = useState<CollegeBrandingConfig>(INITIAL_BRANDING);

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

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);

  const setCurrentUser = (u: User) => {
    setCurrentUserState(u);
    clientStorage.saveCurrentUser(u);
  };

  const logout = () => {
    clientStorage.saveCurrentUser(null);
    setCurrentUserState(SYSTEM_ADMIN_USER);
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

  const setCurrentUserRole = (role: UserRole) => {
    if (role === 'ADMIN') {
      setCurrentUser(SYSTEM_ADMIN_USER);
      showToast('Switched Persona', 'Now acting as Institutional Administrator.', 'success');
      return;
    }

    // Look for an existing user in storage with that role
    const users = clientStorage.getUsers().filter((u) => u.role === role);
    if (users.length > 0) {
      setCurrentUser(users[0]);
      showToast('Switched Persona', `Now acting as ${users[0].name} (${role})`, 'success');
    } else {
      // Create a test user for that role if none exists so user isn't stuck
      const mockEmail = role === 'TEACHER' ? 'prof.sharma@apex.edu' : 'rahul.verma@apex.edu';
      const mockName = role === 'TEACHER' ? 'Prof. Priya Sharma' : 'Rahul Verma';
      const studentId = role === 'STUDENT' ? 'STU-2026-1042' : undefined;

      const newUser: User = {
        id: `usr-${role.toLowerCase()}-demo`,
        name: mockName,
        email: mockEmail,
        role,
        department: 'Computer Science & Engineering',
        year: role === 'STUDENT' ? '3rd Year' : undefined,
        studentId,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(mockName)}`,
        profileComplete: true,
        skills: role === 'STUDENT' ? ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'] : undefined,
        createdAt: new Date().toISOString()
      };

      const existingUsers = clientStorage.getUsers();
      clientStorage.saveUsers([newUser, ...existingUsers]);
      setCurrentUser(newUser);
      showToast('Activated Persona', `Created & logged in as ${mockName} (${role})`, 'success');
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [projList, authList, notifList, reqList, logList] = await Promise.all([
        apiService.getProjects(currentUser),
        apiService.getAuthorizedEmails(),
        apiService.getNotifications(currentUser.id),
        apiService.getCollaborationRequests(currentUser.id),
        apiService.getActivityLogs()
      ]);

      setProjects(projList);
      setAuthorizedEmails(authList);
      setNotifications(notifList);
      setRequests(reqList);
      setActivityLogs(logList);

      const targetProjectId = activeProjectId || (projList.length > 0 ? projList[0].id : '');
      if (targetProjectId) {
        const [docs, contribs, ai] = await Promise.all([
          apiService.getProjectDocuments(targetProjectId),
          apiService.getStudentContributions(targetProjectId),
          apiService.getProjectAIAnalysis(targetProjectId)
        ]);
        setProjectDocuments(docs);
        setContributions(contribs);
        setAiAnalysis(ai);
      } else {
        setProjectDocuments([]);
        setContributions([]);
        setAiAnalysis(undefined);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [activeProjectId, currentUser.id, currentUser.role]);

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
    const updated = await apiService.updateProject(id, updates, currentUser.id);
    showToast('Project Updated', `Changes to '${updated.name}' saved.`, 'success');
    await refreshData();
    return updated;
  };

  const finalizeProject = async (id: string) => {
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
    const contrib = await apiService.updateStudentContribution(id, currentUser.id, updates);
    showToast('Submission Updated', `Contribution updated.`, 'info');
    await refreshData();
    return contrib;
  };

  const deleteStudentContribution = async (id: string) => {
    const ok = await apiService.deleteStudentContribution(id, currentUser.id);
    if (ok) {
      showToast('Submission Removed', 'Your contribution was deleted.', 'info');
      await refreshData();
    }
    return ok;
  };

  const updateUserProfile = async (updates: Partial<User>) => {
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
    showToast('System Reset', 'All runtime business records purged. Ready for fresh test.', 'warning');
    await refreshData();
  };

  const seedDemoData = async () => {
    // Add sample authorized emails to jumpstart testing
    await apiService.bulkAddAuthorizedEmails(
      ['prof.sharma@apex.edu', 'prof.arun@apex.edu', 'dr.patel@apex.edu'],
      'TEACHER'
    );
    await apiService.bulkAddAuthorizedEmails(
      ['rahul.verma@apex.edu', 'sneha.rao@apex.edu', 'vikram.singh@apex.edu', 'ananya.iyer@apex.edu', 'rohit.gupta@apex.edu'],
      'STUDENT'
    );
    showToast('Demo Authorized Emails Seeded', 'Added teacher & student emails to Admin list for quick testing.', 'info');
    await refreshData();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        setCurrentUserRole,
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
        seedDemoData,
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
