import {
  User,
  UserRole,
  AuthorizedEmail,
  Project,
  ProjectDocument,
  StudentContribution,
  StudentProfile,
  AIAnalysisResult,
  NotificationItem,
  Message,
  CollaborationRequest,
  ActivityLog
} from '../types';

import { clientStorage } from '../storage/clientStorage';
import { aiEngine } from './aiEngine';

const simulatedDelay = (ms = 80) => new Promise((res) => setTimeout(res, ms));

class ApiService {
  // Clear / Reset Mechanism — Returns system to empty state
  async resetAllData(): Promise<void> {
    clientStorage.resetAllBusinessData();
  }

  // ============================================================
  // AUTHORIZED EMAILS (Admin Authority)
  // ============================================================
  async getAuthorizedEmails(): Promise<AuthorizedEmail[]> {
    await simulatedDelay();
    return clientStorage.getAuthorizedEmails();
  }

  async addAuthorizedEmail(email: string, role: 'TEACHER' | 'STUDENT'): Promise<AuthorizedEmail> {
    await simulatedDelay();
    const cleanEmail = email.trim().toLowerCase();
    const existing = clientStorage.getAuthorizedEmails();
    const found = existing.find((e) => e.email.toLowerCase() === cleanEmail);
    if (found) {
      throw new Error(`Email ${cleanEmail} is already on the authorized list.`);
    }

    const newAuth: AuthorizedEmail = {
      id: `auth-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      email: cleanEmail,
      role,
      addedAt: new Date().toISOString(),
      status: 'NOT_REGISTERED'
    };

    clientStorage.saveAuthorizedEmails([newAuth, ...existing]);
    await this.logActivity('Authorized Email Added', `${role}: ${cleanEmail}`, { name: 'Admin', role: 'ADMIN' });
    return newAuth;
  }

  async bulkAddAuthorizedEmails(
    emails: string[],
    role: 'TEACHER' | 'STUDENT'
  ): Promise<{ added: number; skipped: number }> {
    await simulatedDelay();
    const existing = clientStorage.getAuthorizedEmails();
    const existingSet = new Set(existing.map((e) => e.email.toLowerCase()));
    const toAdd: AuthorizedEmail[] = [];
    let skipped = 0;

    for (const raw of emails) {
      const email = raw.trim().toLowerCase();
      if (!email || !email.includes('@')) continue;
      if (existingSet.has(email)) {
        skipped++;
        continue;
      }
      existingSet.add(email);
      toAdd.push({
        id: `auth-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        email,
        role,
        addedAt: new Date().toISOString(),
        status: 'NOT_REGISTERED'
      });
    }

    if (toAdd.length > 0) {
      clientStorage.saveAuthorizedEmails([...toAdd, ...existing]);
      await this.logActivity(
        'Bulk Authorized Emails Added',
        `${toAdd.length} ${role} emails authorized`,
        { name: 'Admin', role: 'ADMIN' }
      );
    }

    return { added: toAdd.length, skipped };
  }

  async removeAuthorizedEmail(id: string): Promise<boolean> {
    await simulatedDelay();
    const existing = clientStorage.getAuthorizedEmails();
    const target = existing.find((e) => e.id === id);
    if (!target) return false;

    // Remove from authorized list
    const filtered = existing.filter((e) => e.id !== id);
    clientStorage.saveAuthorizedEmails(filtered);
    await this.logActivity('Authorized Email Revoked', target.email, { name: 'Admin', role: 'ADMIN' });
    return true;
  }

  async checkEmailAuthorization(email: string): Promise<AuthorizedEmail | null> {
    await simulatedDelay();
    const cleanEmail = email.trim().toLowerCase();
    const list = clientStorage.getAuthorizedEmails();
    return list.find((e) => e.email.toLowerCase() === cleanEmail) || null;
  }

  // ============================================================
  // USERS & REGISTRATION
  // ============================================================
  async getUsers(): Promise<User[]> {
    await simulatedDelay();
    return clientStorage.getUsers();
  }

  async getUser(id: string): Promise<User | undefined> {
    await simulatedDelay();
    return clientStorage.getUsers().find((u) => u.id === id);
  }

  async registerUser(params: {
    email: string;
    name: string;
    department: string;
    year?: string;
    bio?: string;
    skills?: string[];
    github?: string;
    linkedin?: string;
  }): Promise<User> {
    await simulatedDelay(150);
    const cleanEmail = params.email.trim().toLowerCase();

    // 1. Verify email authorization
    const authList = clientStorage.getAuthorizedEmails();
    const authRecord = authList.find((e) => e.email.toLowerCase() === cleanEmail);

    if (!authRecord) {
      throw new Error('This email address has not been approved by an administrator. Please contact your college admin.');
    }

    // 2. Check if user already registered
    const existingUsers = clientStorage.getUsers();
    if (existingUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    // 3. Generate permanent unique student ID if student
    let studentId: string | undefined = undefined;
    if (authRecord.role === 'STUDENT') {
      const yearPrefix = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      studentId = `STU-${yearPrefix}-${randomSuffix}`;
    }

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      email: cleanEmail,
      name: params.name.trim(),
      role: authRecord.role,
      department: params.department,
      year: params.year,
      bio: params.bio || '',
      skills: params.skills || [],
      github: params.github || '',
      linkedin: params.linkedin || '',
      studentId,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(params.name)}`,
      profileComplete: true,
      createdAt: new Date().toISOString()
    };

    // 4. Update authorized email status
    authRecord.status = 'ACTIVE';
    authRecord.userId = newUser.id;
    clientStorage.saveAuthorizedEmails([...authList]);

    // 5. Save user
    clientStorage.saveUsers([...existingUsers, newUser]);

    // 6. Create initial student profile if student
    if (newUser.role === 'STUDENT') {
      const profiles = clientStorage.getStudentProfiles();
      const newProfile: StudentProfile = {
        id: `prof-${newUser.id}`,
        userId: newUser.id,
        department: newUser.department,
        year: newUser.year || '3rd Year',
        bio: newUser.bio || '',
        skills: (newUser.skills || []).map((sk) => ({
          name: sk,
          proficiency: 75,
          verificationState: 'Unverified',
          evidenceCount: 0
        })),
        evidenceMap: [],
        projects: []
      };
      profiles[newUser.id] = newProfile;
      clientStorage.saveStudentProfiles(profiles);
    }

    await this.logActivity(
      'User Registered',
      `${newUser.name} (${newUser.role})${newUser.studentId ? ` ID: ${newUser.studentId}` : ''}`,
      { name: newUser.name, role: newUser.role }
    );

    return newUser;
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    await simulatedDelay();
    const users = clientStorage.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('User not found');

    const currentUser = users[index];

    // Security check: non-editable fields
    // Student ID, Role, Email cannot be edited by student
    const sanitizedUpdates: Partial<User> = { ...updates };
    delete sanitizedUpdates.id;
    delete sanitizedUpdates.role;
    delete sanitizedUpdates.email;
    delete sanitizedUpdates.studentId;
    delete sanitizedUpdates.createdAt;

    const updatedUser: User = {
      ...currentUser,
      ...sanitizedUpdates
    };

    users[index] = updatedUser;
    clientStorage.saveUsers([...users]);

    // Also update student profile if matching
    if (updatedUser.role === 'STUDENT') {
      const profiles = clientStorage.getStudentProfiles();
      if (profiles[userId]) {
        profiles[userId] = {
          ...profiles[userId],
          department: updatedUser.department,
          year: updatedUser.year || profiles[userId].year,
          bio: updatedUser.bio || profiles[userId].bio
        };
        clientStorage.saveStudentProfiles(profiles);
      }
    }

    return updatedUser;
  }

  async searchStudents(params: {
    query?: string;
    department?: string;
    year?: string;
    skills?: string[];
  }): Promise<User[]> {
    await simulatedDelay();
    const users = clientStorage.getUsers().filter((u) => u.role === 'STUDENT');

    return users.filter((student) => {
      if (params.query) {
        const q = params.query.toLowerCase();
        const nameMatch = student.name.toLowerCase().includes(q);
        const emailMatch = student.email.toLowerCase().includes(q);
        const idMatch = student.studentId?.toLowerCase().includes(q);
        const deptMatch = student.department?.toLowerCase().includes(q);
        const skillMatch = student.skills?.some((s) => s.toLowerCase().includes(q));
        if (!nameMatch && !emailMatch && !idMatch && !deptMatch && !skillMatch) {
          return false;
        }
      }

      if (params.department && params.department !== 'All Departments') {
        if (student.department !== params.department) return false;
      }

      if (params.year && params.year !== 'All Years') {
        if (student.year !== params.year) return false;
      }

      if (params.skills && params.skills.length > 0) {
        const studentSkills = (student.skills || []).map((s) => s.toLowerCase());
        const matchesSkill = params.skills.some((sk) => studentSkills.includes(sk.toLowerCase()));
        if (!matchesSkill) return false;
      }

      return true;
    });
  }

  async getStudentProfile(userId: string): Promise<StudentProfile | undefined> {
    await simulatedDelay();
    const profiles = clientStorage.getStudentProfiles();
    return profiles[userId];
  }

  async updateStudentProfile(userId: string, profile: Partial<StudentProfile>): Promise<StudentProfile> {
    await simulatedDelay();
    const profiles = clientStorage.getStudentProfiles();
    const existing = profiles[userId] || {
      id: `prof-${userId}`,
      userId,
      department: '',
      year: '',
      bio: '',
      skills: [],
      evidenceMap: [],
      projects: []
    };

    const updated: StudentProfile = {
      ...existing,
      ...profile
    };

    profiles[userId] = updated;
    clientStorage.saveStudentProfiles(profiles);
    return updated;
  }

  // ============================================================
  // PROJECTS (Teacher authority)
  // ============================================================
  async getProjects(user?: { id: string; role: UserRole }): Promise<Project[]> {
    await simulatedDelay();
    const projects = clientStorage.getProjects();
    if (!user) return projects;

    if (user.role === 'ADMIN') {
      return projects;
    }

    if (user.role === 'TEACHER') {
      return projects.filter((p) => p.teacherId === user.id);
    }

    // STUDENT: only projects they are member of or team leader of
    return projects.filter(
      (p) => p.memberIds.includes(user.id) || p.teamLeaderId === user.id
    );
  }

  async getProject(id: string, user?: { id: string; role: UserRole }): Promise<Project | undefined> {
    await simulatedDelay();
    const projects = clientStorage.getProjects();
    const project = projects.find((p) => p.id === id);
    if (!project) return undefined;
    if (!user) return project;

    if (user.role === 'ADMIN') return project;
    if (user.role === 'TEACHER' && project.teacherId === user.id) return project;
    if (
      user.role === 'STUDENT' &&
      (project.memberIds.includes(user.id) || project.teamLeaderId === user.id)
    ) {
      return project;
    }

    return undefined;
  }

  async createProject(
    data: {
      name: string;
      description: string;
      problemStatement: string;
      category: string;
      projectType: string;
      duration: string;
      requiredSkills: string[];
      teacherId: string;
      teamLeaderId?: string;
      memberIds?: string[];
      memberRoles?: Record<string, string>;
    }
  ): Promise<Project> {
    await simulatedDelay(150);
    const projects = clientStorage.getProjects();

    // Unique persistent ID: PRJ-XXXXXXXX
    const uniqueSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newProject: Project = {
      id: `PRJ-${uniqueSuffix}`,
      name: data.name.trim(),
      description: data.description.trim(),
      problemStatement: data.problemStatement.trim(),
      category: data.category.trim(),
      projectType: data.projectType.trim(),
      duration: data.duration.trim(),
      requiredSkills: data.requiredSkills || [],
      status: 'DRAFT',
      teacherId: data.teacherId,
      teamLeaderId: data.teamLeaderId,
      memberIds: data.memberIds || [],
      memberRoles: data.memberRoles || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    clientStorage.saveProjects([newProject, ...projects]);

    const teacher = clientStorage.getUsers().find((u) => u.id === data.teacherId);
    await this.logActivity(
      'Project Created',
      `${newProject.name} (${newProject.id})`,
      { name: teacher?.name || 'Teacher', role: 'TEACHER' },
      newProject.id
    );

    return newProject;
  }

  async updateProject(
    id: string,
    updates: Partial<Omit<Project, 'id' | 'teacherId' | 'createdAt'>>,
    teacherId: string
  ): Promise<Project> {
    await simulatedDelay();
    const projects = clientStorage.getProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Project not found');

    const project = projects[index];
    if (project.teacherId !== teacherId) {
      throw new Error('Unauthorized: Only the project creator teacher can edit this project');
    }

    const updatedProject: Project = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    projects[index] = updatedProject;
    clientStorage.saveProjects([...projects]);

    const teacher = clientStorage.getUsers().find((u) => u.id === teacherId);
    await this.logActivity(
      'Project Updated',
      updatedProject.name,
      { name: teacher?.name || 'Teacher', role: 'TEACHER' },
      id
    );

    return updatedProject;
  }

  async finalizeProject(projectId: string, teacherId: string): Promise<Project> {
    await simulatedDelay(200);
    const projects = clientStorage.getProjects();
    const index = projects.findIndex((p) => p.id === projectId);
    if (index === -1) throw new Error('Project not found');

    const project = projects[index];
    if (project.teacherId !== teacherId) {
      throw new Error('Unauthorized: Only the project creator teacher can finalize this project');
    }

    project.status = 'ACTIVE';
    project.updatedAt = new Date().toISOString();
    projects[index] = project;
    clientStorage.saveProjects([...projects]);

    // Send notifications to all assigned students
    const teacher = clientStorage.getUsers().find((u) => u.id === teacherId);
    const teacherName = teacher?.name || 'Your Teacher';
    const allAssignedIds = new Set<string>();
    if (project.teamLeaderId) allAssignedIds.add(project.teamLeaderId);
    project.memberIds.forEach((mId) => allAssignedIds.add(mId));

    const notifications = clientStorage.getNotifications();
    const newNotifications: NotificationItem[] = [];

    allAssignedIds.forEach((studentId) => {
      const isLeader = studentId === project.teamLeaderId;
      const assignedRole = project.memberRoles[studentId] || (isLeader ? 'Team Leader' : 'Team Member');

      newNotifications.push({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: studentId,
        title: isLeader
          ? `Assigned as Team Leader: ${project.name}`
          : `Assigned to Project: ${project.name}`,
        description: `${teacherName} assigned you to "${project.name}" (ID: ${project.id}) with role "${assignedRole}".`,
        category: 'PROJECT_ASSIGNMENT',
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: `/projects/${project.id}`,
        projectId: project.id,
        projectName: project.name
      });
    });

    if (newNotifications.length > 0) {
      clientStorage.saveNotifications([...newNotifications, ...notifications]);
    }

    await this.logActivity(
      'Project Finalized & Team Assigned',
      `${project.name} (${allAssignedIds.size} students assigned)`,
      { name: teacherName, role: 'TEACHER' },
      projectId
    );

    return project;
  }

  // ============================================================
  // PROJECT DOCUMENTS (Teacher uploads)
  // ============================================================
  async getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    await simulatedDelay();
    return clientStorage.getProjectDocuments().filter((d) => d.projectId === projectId);
  }

  async uploadProjectDocument(
    projectId: string,
    fileData: {
      name: string;
      type: ProjectDocument['type'];
      size: string;
      fileRef?: string;
      uploadedById: string;
      uploadedByName: string;
    }
  ): Promise<ProjectDocument> {
    await simulatedDelay(150);
    const docs = clientStorage.getProjectDocuments();

    // Check if browser/format can be analyzed
    const analyzableTypes = ['PDF', 'Markdown', 'DOCX', 'Code'];
    const isAnalyzable = analyzableTypes.includes(fileData.type) || fileData.name.endsWith('.txt') || fileData.name.endsWith('.md');

    const newDoc: ProjectDocument = {
      id: `pdoc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      projectId,
      name: fileData.name,
      type: fileData.type,
      size: fileData.size,
      uploadedById: fileData.uploadedById,
      uploadedByName: fileData.uploadedByName,
      uploadedAt: new Date().toISOString(),
      fileRef: fileData.fileRef,
      analysisAvailable: isAnalyzable,
      analysisNote: isAnalyzable
        ? 'Processed for AI Team Analysis'
        : 'Analysis unavailable for this format (binary/compressed). Requirement metadata preserved.'
    };

    clientStorage.saveProjectDocuments([newDoc, ...docs]);

    await this.logActivity(
      'Project Document Uploaded',
      `${newDoc.name} (${newDoc.size})`,
      { name: fileData.uploadedByName, role: 'TEACHER' },
      projectId
    );

    return newDoc;
  }

  async deleteProjectDocument(docId: string, teacherId: string): Promise<boolean> {
    await simulatedDelay();
    const docs = clientStorage.getProjectDocuments();
    const target = docs.find((d) => d.id === docId);
    if (!target) return false;

    // Verify ownership
    const projects = clientStorage.getProjects();
    const project = projects.find((p) => p.id === target.projectId);
    if (project && project.teacherId !== teacherId && target.uploadedById !== teacherId) {
      throw new Error('Unauthorized to delete this project document');
    }

    clientStorage.saveProjectDocuments(docs.filter((d) => d.id !== docId));
    return true;
  }

  // ============================================================
  // STUDENT CONTRIBUTIONS (Student uploads in assigned workspace)
  // ============================================================
  async getStudentContributions(projectId: string): Promise<StudentContribution[]> {
    await simulatedDelay();
    return clientStorage.getContributions().filter((c) => c.projectId === projectId);
  }

  async addStudentContribution(params: {
    projectId: string;
    studentId: string;
    studentName: string;
    title: string;
    description: string;
    fileName?: string;
    fileRef?: string;
    fileSize?: string;
  }): Promise<StudentContribution> {
    await simulatedDelay(150);
    const contributions = clientStorage.getContributions();

    const newContrib: StudentContribution = {
      id: `contrib-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      projectId: params.projectId,
      studentId: params.studentId,
      studentName: params.studentName,
      title: params.title.trim(),
      description: params.description.trim(),
      fileName: params.fileName,
      fileRef: params.fileRef,
      fileSize: params.fileSize,
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    clientStorage.saveContributions([newContrib, ...contributions]);

    await this.logActivity(
      'Student Work Uploaded',
      `${params.title} by ${params.studentName}`,
      { name: params.studentName, role: 'STUDENT' },
      params.projectId
    );

    return newContrib;
  }

  async updateStudentContribution(
    id: string,
    studentId: string,
    updates: { title?: string; description?: string }
  ): Promise<StudentContribution> {
    await simulatedDelay();
    const list = clientStorage.getContributions();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Contribution not found');

    if (list[index].studentId !== studentId) {
      throw new Error('Unauthorized: You can only edit your own contributions');
    }

    const updated: StudentContribution = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    list[index] = updated;
    clientStorage.saveContributions([...list]);
    return updated;
  }

  async deleteStudentContribution(id: string, studentId: string): Promise<boolean> {
    await simulatedDelay();
    const list = clientStorage.getContributions();
    const target = list.find((c) => c.id === id);
    if (!target) return false;

    if (target.studentId !== studentId) {
      throw new Error('Unauthorized: You can only delete your own uploaded content');
    }

    clientStorage.saveContributions(list.filter((c) => c.id !== id));
    return true;
  }

  // ============================================================
  // AI COMPATIBILITY ANALYSIS
  // ============================================================
  async runProjectAIAnalysis(projectId: string): Promise<AIAnalysisResult> {
    await simulatedDelay(350);
    const projects = clientStorage.getProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) throw new Error('Project not found');
    const result = aiEngine.analyzeProjectTeamCompatibility(project);
    const existing = clientStorage.getAIAnalyses();
    const filtered = existing.filter((a) => a.projectId !== projectId);
    clientStorage.saveAIAnalyses([result, ...filtered]);
    return result;
  }

  async getProjectAIAnalysis(projectId: string): Promise<AIAnalysisResult | undefined> {
    await simulatedDelay();
    const list = clientStorage.getAIAnalyses();
    return list.find((a) => a.projectId === projectId);
  }

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  async getNotifications(userId: string): Promise<NotificationItem[]> {
    await simulatedDelay();
    return clientStorage.getNotifications().filter((n) => n.userId === userId);
  }

  async markNotificationRead(id: string): Promise<void> {
    const list = clientStorage.getNotifications();
    const notif = list.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      clientStorage.saveNotifications([...list]);
    }
  }

  // ============================================================
  // MESSAGES (Chat, Direct Message, Mentor Contact)
  // ============================================================
  async getMessages(channelType: Message['channelType'], channelId: string): Promise<Message[]> {
    await simulatedDelay();
    return clientStorage.getMessages().filter(
      (m) => m.channelType === channelType && m.channelId === channelId
    );
  }

  async sendMessage(params: {
    channelType: Message['channelType'];
    channelId: string;
    sender: User;
    text: string;
    recipientId?: string;
  }): Promise<Message> {
    await simulatedDelay(50);
    const messages = clientStorage.getMessages();

    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      channelType: params.channelType,
      channelId: params.channelId,
      senderId: params.sender.id,
      senderName: params.sender.name,
      senderAvatar: params.sender.avatar,
      senderRole: params.sender.role,
      text: params.text.trim(),
      timestamp: new Date().toISOString(),
      recipientId: params.recipientId
    };

    clientStorage.saveMessages([...messages, newMsg]);
    return newMsg;
  }

  // ============================================================
  // COLLABORATION REQUESTS
  // ============================================================
  async getCollaborationRequests(userId: string): Promise<CollaborationRequest[]> {
    await simulatedDelay();
    return clientStorage.getRequests().filter(
      (r) => r.receiverId === userId || r.senderId === userId
    );
  }

  async sendCollaborationRequest(params: {
    sender: User;
    receiverId: string;
    projectTitle: string;
    suggestedRole: string;
    message: string;
  }): Promise<CollaborationRequest> {
    await simulatedDelay(100);
    const requests = clientStorage.getRequests();

    const newReq: CollaborationRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: params.sender.id,
      senderName: params.sender.name,
      senderAvatar: params.sender.avatar,
      receiverId: params.receiverId,
      projectTitle: params.projectTitle.trim(),
      suggestedRole: params.suggestedRole.trim(),
      message: params.message.trim(),
      status: 'Pending',
      sentAt: new Date().toISOString()
    };

    clientStorage.saveRequests([newReq, ...requests]);

    // Send notification to receiver
    const notifs = clientStorage.getNotifications();
    notifs.push({
      id: `notif-${Date.now()}`,
      userId: params.receiverId,
      title: `Collaboration Request from ${params.sender.name}`,
      description: `Wants to collaborate on "${params.projectTitle}" as "${params.suggestedRole}".`,
      category: 'TEAM_UPDATE',
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: '/collaborations'
    });
    clientStorage.saveNotifications(notifs);

    return newReq;
  }

  async respondToCollaborationRequest(
    id: string,
    status: 'Accepted' | 'Rejected'
  ): Promise<CollaborationRequest> {
    await simulatedDelay();
    const requests = clientStorage.getRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error('Request not found');

    req.status = status;
    clientStorage.saveRequests([...requests]);
    return req;
  }

  // ============================================================
  // ACTIVITY LOGS
  // ============================================================
  async getActivityLogs(projectId?: string): Promise<ActivityLog[]> {
    await simulatedDelay();
    const logs = clientStorage.getActivityLogs();
    if (projectId) {
      return logs.filter((l) => l.projectId === projectId);
    }
    return logs;
  }

  async logActivity(
    action: string,
    object: string,
    actor: { name: string; role: string },
    projectId?: string
  ): Promise<void> {
    const logs = clientStorage.getActivityLogs();
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      object,
      timestamp: new Date().toISOString(),
      projectId
    };
    clientStorage.saveActivityLogs([newLog, ...logs.slice(0, 99)]);
  }
}

export const apiService = new ApiService();
