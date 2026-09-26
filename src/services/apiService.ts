/**
 * apiService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * All data operations for the Start-X frontend.
 *
 * Architecture:
 *   - Auth/Admin email management  → Java Spring Boot backend (VITE_BACKEND_URL)
 *   - Projects / Teams / Members   → Supabase DB directly (authenticated client)
 *   - Documents                    → Supabase Storage + DB
 *   - Contributions / Messages     → Supabase DB
 *   - Notifications                → Supabase DB
 *   - Collaboration requests       → Supabase DB
 *   - AI analysis                  → Supabase Edge Function (aiAnalysisService)
 *
 * SECURITY:
 *   - All Supabase calls use the authenticated user client → RLS enforced.
 *   - Service-role key is NEVER used here (server-only).
 *   - No mock data. No simulatedDelay. No localStorage for business data.
 *
 * localStorage is only used for:
 *   - currentUser session cache  (authService)
 *   - auth token                 (authService)
 *   - branding config            (clientStorage)
 * ─────────────────────────────────────────────────────────────────────────────
 */

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
  ActivityLog,
} from '../types';

import { supabase } from '../lib/supabase';
import { authService } from './authService';
import { aiEngine } from './aiEngine';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
const STORAGE_BUCKET = 'project-documents';

// ─────────────────────────────────────────────────────────────────────────────
// Backend fetch helper (for Java Spring Boot admin endpoints)
// ─────────────────────────────────────────────────────────────────────────────
async function backendFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = authService.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${BACKEND_URL}${path}`, { ...options, headers });
}

function mapBackendEmailDto(dto: Record<string, unknown>): AuthorizedEmail {
  const role =
    dto.role === 'ADMIN'
      ? 'STUDENT'
      : (dto.role as 'TEACHER' | 'STUDENT') || 'STUDENT';
  return {
    id:      (dto.id as string)        || '',
    email:   (dto.email as string)     || '',
    role,
    addedAt: (dto.createdAt as string) || new Date().toISOString(),
    status:  mapBackendStatus(dto.status as string),
    userId:  (dto.linkedUserId as string) || undefined,
  };
}

function mapBackendStatus(s: string): 'NOT_REGISTERED' | 'REGISTERED' | 'ACTIVE' {
  switch ((s || '').toLowerCase()) {
    case 'active':     return 'ACTIVE';
    case 'registered': return 'REGISTERED';
    default:           return 'NOT_REGISTERED';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Map Supabase DB rows → frontend types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map a `teams` row + its members + leader into the frontend Project shape.
 * The frontend Project type is a flat view of a team; this adapter bridges that.
 */
function dbTeamToProject(
  team: Record<string, unknown>,
  members: Array<{ student_id: string; role: string }> = [],
  leaderStudentId?: string,
): Project {
  const memberIds = members
    .filter((m) => m.student_id !== leaderStudentId)
    .map((m) => m.student_id);

  const memberRoles: Record<string, string> = {};
  members.forEach((m) => {
    memberRoles[m.student_id] = m.role || 'Team Member';
  });

  const meta = (team.metadata as Record<string, unknown>) || {};

  return {
    id: team.team_id as string,
    name: team.team_name as string,
    description: (team.description as string) || '',
    problemStatement: (team.problem_statement as string) || '',
    category: (meta.category as string) || '',
    projectType: (meta.project_type as string) || '',
    duration: (meta.duration as string) || '',
    requiredSkills: (meta.required_skills as string[]) || [],
    status: dbStatusToProjectStatus(team.status as string),
    teacherId: (meta.teacher_user_id as string) || '',
    teamLeaderId: leaderStudentId,
    memberIds,
    memberRoles,
    createdAt: team.created_at as string,
    updatedAt: team.updated_at as string,
  };
}

function dbStatusToProjectStatus(s: string): Project['status'] {
  switch (s) {
    case 'active':    return 'ACTIVE';
    case 'completed': return 'COMPLETED';
    case 'archived':  return 'COMPLETED';
    default:          return 'DRAFT';
  }
}

function projectStatusToDb(s: Project['status']): string {
  switch (s) {
    case 'ACTIVE':    return 'active';
    case 'FINALIZED': return 'active';
    case 'COMPLETED': return 'completed';
    default:          return 'draft';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API Service class
// ─────────────────────────────────────────────────────────────────────────────
class ApiService {

  // ── System reset (clears only localStorage cache) ──────────────────────
  async resetAllData(): Promise<void> {
    // Only clear localStorage caches — we don't purge the real DB here.
    // Use Supabase Dashboard for production data management.
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('startx_') && k !== 'startx_branding_v3') {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }

  // ── Authorized Emails (Admin → Java backend) ──────────────────────────
  async getAuthorizedEmails(): Promise<AuthorizedEmail[]> {
    try {
      const resp = await backendFetch('/api/v1/admin/authorized-users');
      if (resp.ok) {
        const body = await resp.json();
        if (body?.success && Array.isArray(body?.data)) {
          return (body.data as Record<string, unknown>[]).map(mapBackendEmailDto);
        }
      }
      if (resp.status === 401 || resp.status === 403) return [];
    } catch {
      // Backend unreachable
    }
    return [];
  }

  async addAuthorizedEmail(email: string, role: 'TEACHER' | 'STUDENT'): Promise<AuthorizedEmail> {
    const cleanEmail = email.trim().toLowerCase();
    const resp = await backendFetch('/api/v1/admin/authorized-users', {
      method: 'POST',
      body: JSON.stringify({ email: cleanEmail, role }),
    });
    const body = await resp.json();
    if (!resp.ok || !body.success) {
      throw new Error(body?.message || `Failed to authorize ${cleanEmail}.`);
    }
    return mapBackendEmailDto(body.data as Record<string, unknown>);
  }

  async bulkAddAuthorizedEmails(
    emails: string[],
    role: 'TEACHER' | 'STUDENT',
  ): Promise<{ added: number; skipped: number }> {
    const resp = await backendFetch('/api/v1/admin/authorized-users/bulk', {
      method: 'POST',
      body: JSON.stringify({ emails, role }),
    });
    const body = await resp.json();
    if (!resp.ok || !body.success) throw new Error(body?.message || 'Bulk add failed.');
    const { added = 0, skipped = 0 } = body.data as { added: number; skipped: number };
    return { added, skipped };
  }

  async removeAuthorizedEmail(id: string): Promise<boolean> {
    try {
      const resp = await backendFetch(`/api/v1/admin/authorized-users/${id}`, {
        method: 'DELETE',
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  async checkEmailAuthorization(email: string): Promise<AuthorizedEmail | null> {
    const all = await this.getAuthorizedEmails();
    return all.find((e) => e.email.toLowerCase() === email.trim().toLowerCase()) || null;
  }

  // ── Users ─────────────────────────────────────────────────────────────
  async getUsers(): Promise<User[]> {
    // Fetch registered users from Supabase users table
    const { data, error } = await supabase
      .from('users')
      .select('user_id, email, full_name, avatar_url, role, created_at, updated_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('getUsers error:', error.message);
      return [];
    }

    return (data || []).map((u) => ({
      id: u.user_id,
      email: u.email,
      name: u.full_name,
      avatar: u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.full_name || u.email)}`,
      role: (u.role.toUpperCase()) as UserRole,
      department: '',
      year: undefined,
      bio: undefined,
      skills: [],
      createdAt: u.created_at,
    }));
  }

  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, email, full_name, avatar_url, role, created_at')
      .eq('user_id', id)
      .maybeSingle();

    if (error || !data) return undefined;

    return {
      id: data.user_id,
      email: data.email,
      name: data.full_name,
      avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.full_name || data.email)}`,
      role: (data.role.toUpperCase()) as UserRole,
      department: '',
      skills: [],
      createdAt: data.created_at,
    };
  }

  async searchStudents(params: {
    query?: string;
    department?: string;
    year?: string;
    skills?: string[];
  }): Promise<User[]> {
    // Query students + user join for profile data
    let query = supabase
      .from('students')
      .select(`
        student_id,
        program,
        year_of_study,
        student_number,
        users!inner (user_id, email, full_name, avatar_url, role, is_active),
        student_profiles (bio, availability, looking_for_team,
          skills (skill_name, proficiency_level, is_verified)
        )
      `)
      .eq('is_active', true)
      .eq('users.is_active', true);

    const { data, error } = await query.limit(100);

    if (error) {
      console.warn('searchStudents error:', error.message);
      return [];
    }

    let students = (data || []).map((s: any) => {
      const user = s.users;
      const profile = s.student_profiles?.[0] || null;
      const skillNames = (profile?.skills || []).map((sk: { skill_name: string }) => sk.skill_name);
      return {
        id: user.user_id,
        email: user.email,
        name: user.full_name,
        avatar: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.full_name || user.email)}`,
        role: 'STUDENT' as UserRole,
        department: s.program || '',
        year: s.year_of_study ? `${s.year_of_study}${getYearSuffix(s.year_of_study)} Year` : undefined,
        bio: profile?.bio || '',
        skills: skillNames,
        studentId: s.student_number || undefined,
        createdAt: new Date().toISOString(),
        _studentId: s.student_id,
      };
    });

    // Apply filters
    if (params.query) {
      const q = params.query.toLowerCase();
      students = students.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q) ||
        s.skills?.some((sk: string) => sk.toLowerCase().includes(q))
      );
    }
    if (params.department && params.department !== 'All Departments') {
      students = students.filter((s) => s.department === params.department);
    }
    if (params.year && params.year !== 'All Years') {
      students = students.filter((s) => s.year === params.year);
    }
    if (params.skills && params.skills.length > 0) {
      const reqSkills = params.skills.map((sk) => sk.toLowerCase());
      students = students.filter((s) =>
        reqSkills.some((rsk) =>
          (s.skills || []).map((skillName: string) => skillName.toLowerCase()).includes(rsk)
        )
      );
    }

    return students;
  }

  async getStudentProfile(userId: string): Promise<StudentProfile | undefined> {
    // Get student_id from user_id
    const { data: studentRow } = await supabase
      .from('students')
      .select('student_id, program, year_of_study, student_number')
      .eq('user_id', userId)
      .maybeSingle();

    if (!studentRow) return undefined;

    const { data: profileRow } = await supabase
      .from('student_profiles')
      .select(`
        profile_id, bio, availability, looking_for_team,
        skills (skill_id, skill_name, proficiency_level, evidence_strength, is_verified),
        projects (project_id, project_name, description, technologies, repository_url)
      `)
      .eq('student_id', studentRow.student_id)
      .maybeSingle();

    if (!profileRow) {
      // Return minimal profile
      return {
        id: `prof-${userId}`,
        userId,
        department: studentRow.program || '',
        year: studentRow.year_of_study ? `${studentRow.year_of_study}${getYearSuffix(studentRow.year_of_study)} Year` : '',
        bio: '',
        skills: [],
        evidenceMap: [],
        projects: [],
      };
    }

    return {
      id: profileRow.profile_id,
      userId,
      department: studentRow.program || '',
      year: studentRow.year_of_study ? `${studentRow.year_of_study}${getYearSuffix(studentRow.year_of_study)} Year` : '',
      bio: profileRow.bio || '',
      skills: (profileRow.skills || []).map((sk: any) => ({
        name: sk.skill_name,
        proficiency: proficiencyToNumber(sk.proficiency_level),
        verificationState: sk.is_verified ? 'Verified' : 'Unverified',
        evidenceCount: 0,
      })),
      evidenceMap: [],
      projects: (profileRow.projects || []).map((p: any) => ({
        id: p.project_id,
        name: p.project_name,
        description: p.description || '',
        technologies: Array.isArray(p.technologies) ? p.technologies : [],
        repoUrl: p.repository_url || '',
        verifiedSkills: [],
        date: new Date().toISOString(),
      })),
    };
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    // Sanitize — never update id, role, email, studentId via this method
    const { id: _id, role: _role, email: _email, studentId: _sid, createdAt: _ca, ...safe } = updates;

    // Update users table
    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: safe.name,
        avatar_url: safe.avatar,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('user_id, email, full_name, avatar_url, role, created_at')
      .single();

    if (error) throw new Error(`Failed to update profile: ${error.message}`);

    // Update student_profiles if student
    if (safe.bio || safe.github || safe.linkedin) {
      const { data: stuRow } = await supabase
        .from('students')
        .select('student_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (stuRow?.student_id) {
        const { data: profileRow } = await supabase
          .from('student_profiles')
          .select('profile_id')
          .eq('student_id', stuRow.student_id)
          .maybeSingle();

        if (profileRow?.profile_id) {
          await supabase
            .from('student_profiles')
            .update({
              bio: safe.bio ?? undefined,
              github_url: safe.github ?? undefined,
              linkedin_url: safe.linkedin ?? undefined,
              updated_at: new Date().toISOString(),
            })
            .eq('profile_id', profileRow.profile_id);
        }
      }
    }

    return {
      id: data.user_id,
      email: data.email,
      name: data.full_name,
      avatar: data.avatar_url || '',
      role: (data.role.toUpperCase()) as UserRole,
      department: updates.department || '',
      year: updates.year,
      bio: updates.bio || '',
      skills: updates.skills || [],
      github: updates.github,
      linkedin: updates.linkedin,
      createdAt: data.created_at,
    };
  }

  async updateStudentProfile(_userId: string, _profile: Partial<StudentProfile>): Promise<StudentProfile> {
    throw new Error('Use updateUserProfile to update profile data.');
  }

  async registerUser(_params: Record<string, unknown>): Promise<User> {
    throw new Error('Use authService.register() for new user registration.');
  }

  // ── Projects (Teams in DB) ────────────────────────────────────────────
  async getProjects(user?: { id: string; role: UserRole }): Promise<Project[]> {
    if (!user) return [];

    let teamsQuery = supabase
      .from('teams')
      .select(`
        team_id, team_name, problem_statement, description,
        status, leader_id, created_by, metadata, created_at, updated_at,
        team_members (student_id, role, is_active)
      `)
      .order('created_at', { ascending: false });

    // Filter by teacher ownership via metadata.teacher_user_id
    if (user.role === 'TEACHER') {
      // Use RLS + metadata filter — staff can see all teams they created
      teamsQuery = teamsQuery.contains('metadata', { teacher_user_id: user.id });
    } else if (user.role === 'STUDENT') {
      // Get teams the student belongs to via team_members (handled by RLS)
      // RLS: get_my_team_ids() ensures student sees only their teams
    }

    const { data, error } = await teamsQuery;

    if (error) {
      console.warn('getProjects error:', error.message);
      return [];
    }

    return (data || []).map((team: any) => {
      const activeMembers = (team.team_members || []).filter((m: any) => m.is_active);
      const leaderRow = team.leader_id
        ? activeMembers.find((m: any) => {
            // leader_id is a student_id — need to match
            return true; // we'll set leaderStudentId via metadata
          })
        : null;
      void leaderRow;
      const leaderStudentId = (team.metadata?.leader_student_id as string) || undefined;
      return dbTeamToProject(team, activeMembers, leaderStudentId);
    });
  }

  async getProject(id: string, _user?: { id: string; role: UserRole }): Promise<Project | undefined> {
    const { data: team, error } = await supabase
      .from('teams')
      .select(`
        team_id, team_name, problem_statement, description,
        status, leader_id, created_by, metadata, created_at, updated_at,
        team_members (student_id, role, is_active)
      `)
      .eq('team_id', id)
      .maybeSingle();

    if (error || !team) return undefined;

    const activeMembers = ((team as any).team_members || []).filter((m: any) => m.is_active);
    const leaderStudentId = ((team as any).metadata?.leader_student_id as string) || undefined;
    return dbTeamToProject(team as any, activeMembers, leaderStudentId);
  }

  async createProject(data: {
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
  }): Promise<Project> {
    // Resolve staff_id for the teacher
    const { data: staffRow } = await supabase
      .from('staff')
      .select('staff_id')
      .eq('user_id', data.teacherId)
      .maybeSingle();

    const staffId = staffRow?.staff_id || null;

    // Resolve leader student_id if provided (data.teamLeaderId is a user_id)
    let leaderStudentId: string | undefined;
    if (data.teamLeaderId) {
      const { data: stuRow } = await supabase
        .from('students')
        .select('student_id')
        .eq('user_id', data.teamLeaderId)
        .maybeSingle();
      leaderStudentId = stuRow?.student_id;
    }

    // Create the team
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .insert({
        team_name: data.name.trim(),
        problem_statement: data.problemStatement.trim(),
        description: data.description.trim(),
        created_by: staffId,
        status: 'draft',
        metadata: {
          category: data.category,
          project_type: data.projectType,
          duration: data.duration,
          required_skills: data.requiredSkills,
          teacher_user_id: data.teacherId,
          leader_student_id: leaderStudentId || null,
        },
      })
      .select()
      .single();

    if (teamErr) throw new Error(`Failed to create project: ${teamErr.message}`);

    // Add members
    const memberInserts: Array<{ team_id: string; student_id: string; role: string }> = [];

    if (leaderStudentId) {
      memberInserts.push({
        team_id: team.team_id,
        student_id: leaderStudentId,
        role: 'Team Leader',
      });
    }

    for (const userId of data.memberIds || []) {
      if (userId === data.teamLeaderId) continue;
      const { data: stuRow } = await supabase
        .from('students')
        .select('student_id')
        .eq('user_id', userId)
        .maybeSingle();
      if (stuRow?.student_id) {
        memberInserts.push({
          team_id: team.team_id,
          student_id: stuRow.student_id,
          role: data.memberRoles?.[userId] || 'Team Member',
        });
      }
    }

    if (memberInserts.length > 0) {
      const { error: memberErr } = await supabase
        .from('team_members')
        .insert(memberInserts);
      if (memberErr) console.warn('team_members insert error:', memberErr.message);
    }

    // Fetch and return the full project
    const project = await this.getProject(team.team_id);
    return project!;
  }

  async updateProject(
    id: string,
    updates: Partial<Omit<Project, 'id' | 'teacherId' | 'createdAt'>>,
    teacherId: string,
  ): Promise<Project> {
    // Verify ownership
    const { data: team } = await supabase
      .from('teams')
      .select('team_id, metadata')
      .eq('team_id', id)
      .maybeSingle();

    if (!team) throw new Error('Project not found');
    const meta = (team.metadata as Record<string, unknown>) || {};
    if (meta.teacher_user_id !== teacherId) {
      throw new Error('Unauthorized: Only the project creator can edit this project');
    }

    const newMeta: Record<string, unknown> = {
      ...meta,
      category: updates.category ?? meta.category,
      project_type: updates.projectType ?? meta.project_type,
      duration: updates.duration ?? meta.duration,
      required_skills: updates.requiredSkills ?? meta.required_skills,
    };

    await supabase
      .from('teams')
      .update({
        team_name: updates.name,
        problem_statement: updates.problemStatement,
        description: updates.description,
        status: updates.status ? projectStatusToDb(updates.status) : undefined,
        metadata: newMeta,
        updated_at: new Date().toISOString(),
      })
      .eq('team_id', id);

    const project = await this.getProject(id);
    return project!;
  }

  async finalizeProject(projectId: string, teacherId: string): Promise<Project> {
    // Verify ownership
    const { data: team } = await supabase
      .from('teams')
      .select('team_id, team_name, metadata')
      .eq('team_id', projectId)
      .maybeSingle();

    if (!team) throw new Error('Project not found');
    const meta = (team.metadata as Record<string, unknown>) || {};
    if (meta.teacher_user_id !== teacherId) {
      throw new Error('Unauthorized');
    }

    await supabase
      .from('teams')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('team_id', projectId);

    // Fetch members to send notifications
    const { data: members } = await supabase
      .from('team_members')
      .select('student_id, role, students!inner(user_id)')
      .eq('team_id', projectId)
      .eq('is_active', true);

    if (members && members.length > 0) {
      const notifications = members.map((m: any) => ({
        user_id: m.students.user_id,
        type: 'team_invite',
        title: `Assigned to Project: ${team.team_name}`,
        body: `You have been assigned to "${team.team_name}" with role "${m.role}".`,
        data: {
          project_id: projectId,
          project_name: team.team_name,
          role: m.role,
          action_url: `/projects/${projectId}`,
        },
        is_read: false,
      }));

      await supabase.from('notifications').insert(notifications);
    }

    const project = await this.getProject(projectId);
    return project!;
  }

  // ── Documents ─────────────────────────────────────────────────────────
  async getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('document_id, file_name, file_type, file_mime_type, file_path, file_size, uploaded_by, uploaded_at, is_latest, users!inner(full_name)')
      .eq('team_id', projectId)
      .eq('is_latest', true)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.warn('getProjectDocuments error:', error.message);
      return [];
    }

    return (data || []).map((d: any) => ({
      id: d.document_id,
      projectId,
      name: d.file_name,
      type: mimeToDocType(d.file_mime_type || d.file_name),
      size: d.file_size ? formatFileSize(d.file_size) : 'Unknown',
      uploadedById: d.uploaded_by,
      uploadedByName: d.users?.full_name || 'Unknown',
      uploadedAt: d.uploaded_at,
      fileRef: undefined, // Use getSignedUrl to retrieve
      analysisAvailable: isAnalyzableMime(d.file_mime_type || ''),
      analysisNote: isAnalyzableMime(d.file_mime_type || '')
        ? 'Ready for AI analysis'
        : 'Binary format — AI analysis requires text extraction',
    }));
  }

  async uploadProjectDocument(
    projectId: string,
    fileData: {
      name: string;
      type: ProjectDocument['type'];
      size: string;
      fileRef?: string;       // data URL or blob URL (frontend preview only)
      uploadedById: string;
      uploadedByName: string;
      file?: File;            // actual File object for Supabase Storage upload
    },
  ): Promise<ProjectDocument> {
    const filePath = `teams/${projectId}/${Date.now()}_${fileData.name.replace(/\s+/g, '_')}`;
    let storagePath = filePath;

    // Upload to Supabase Storage if a real File was provided
    if (fileData.file) {
      const { error: storageErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, fileData.file, {
          contentType: fileData.file.type || 'application/octet-stream',
          upsert: false,
        });

      if (storageErr) {
        // If bucket doesn't exist or upload fails, store path only
        console.warn('Storage upload error (non-fatal):', storageErr.message);
      }
    }

    const fileSizeBytes = fileData.file
      ? fileData.file.size
      : parseSizeToBytes(fileData.size);

    const { data: doc, error: dbErr } = await supabase
      .from('documents')
      .insert({
        team_id: projectId,
        uploaded_by: fileData.uploadedById,
        file_name: fileData.name,
        file_type: docTypeToDb(fileData.type),
        file_mime_type: fileData.file?.type || null,
        file_path: storagePath,
        file_size: fileSizeBytes > 0 ? fileSizeBytes : null,
        version: 1,
        is_latest: true,
      })
      .select()
      .single();

    if (dbErr) throw new Error(`Failed to upload document: ${dbErr.message}`);

    return {
      id: doc.document_id,
      projectId,
      name: doc.file_name,
      type: fileData.type,
      size: fileData.size,
      uploadedById: fileData.uploadedById,
      uploadedByName: fileData.uploadedByName,
      uploadedAt: doc.uploaded_at,
      fileRef: fileData.fileRef,
      analysisAvailable: isAnalyzableMime(fileData.file?.type || ''),
      analysisNote: 'Uploaded successfully',
    };
  }

  async deleteProjectDocument(docId: string, teacherId: string): Promise<boolean> {
    const { data: doc } = await supabase
      .from('documents')
      .select('document_id, uploaded_by, file_path')
      .eq('document_id', docId)
      .maybeSingle();

    if (!doc) return false;
    if (doc.uploaded_by !== teacherId) {
      throw new Error('Unauthorized to delete this document');
    }

    // Remove from storage
    if (doc.file_path) {
      await supabase.storage.from(STORAGE_BUCKET).remove([doc.file_path]).catch(() => {});
    }

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('document_id', docId);

    return !error;
  }

  async getDocumentSignedUrl(docId: string): Promise<string | null> {
    const { data: doc } = await supabase
      .from('documents')
      .select('file_path')
      .eq('document_id', docId)
      .maybeSingle();

    if (!doc?.file_path) return null;

    const { data } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(doc.file_path, 3600);

    return data?.signedUrl || null;
  }

  // ── Contributions ─────────────────────────────────────────────────────
  async getStudentContributions(projectId: string): Promise<StudentContribution[]> {
    const { data, error } = await supabase
      .from('contributions')
      .select(`
        contribution_id, title, description, contribution_type,
        submitted_at, updated_at, files, tags,
        students!inner(user_id, users!inner(full_name))
      `)
      .eq('team_id', projectId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.warn('getStudentContributions error:', error.message);
      return [];
    }

    return (data || []).map((c: any) => ({
      id: c.contribution_id,
      projectId,
      studentId: c.students?.user_id || '',
      studentName: c.students?.users?.full_name || 'Unknown',
      title: c.title,
      description: c.description || '',
      fileName: Array.isArray(c.files) && c.files.length > 0 ? (c.files[0] as any)?.name : undefined,
      fileRef: undefined,
      fileSize: Array.isArray(c.files) && c.files.length > 0 ? (c.files[0] as any)?.size : undefined,
      uploadedAt: c.submitted_at,
      updatedAt: c.updated_at,
    }));
  }

  async addStudentContribution(params: {
    projectId: string;
    studentId: string;          // user_id
    studentName: string;
    title: string;
    description: string;
    fileName?: string;
    fileRef?: string;
    fileSize?: string;
  }): Promise<StudentContribution> {
    // Resolve student_id from user_id
    const { data: stuRow } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', params.studentId)
      .maybeSingle();

    if (!stuRow?.student_id) {
      throw new Error('Student profile not found. Please ensure your profile is complete.');
    }

    const files = params.fileName
      ? [{ name: params.fileName, size: params.fileSize || '0 KB' }]
      : [];

    const { data, error } = await supabase
      .from('contributions')
      .insert({
        team_id: params.projectId,
        student_id: stuRow.student_id,
        title: params.title.trim(),
        description: params.description.trim(),
        contribution_type: 'other',
        files,
        tags: [],
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to submit contribution: ${error.message}`);

    return {
      id: data.contribution_id,
      projectId: params.projectId,
      studentId: params.studentId,
      studentName: params.studentName,
      title: data.title,
      description: data.description || '',
      fileName: params.fileName,
      fileRef: params.fileRef,
      fileSize: params.fileSize,
      uploadedAt: data.submitted_at,
      updatedAt: data.updated_at,
    };
  }

  async updateStudentContribution(
    id: string,
    studentUserId: string,
    updates: { title?: string; description?: string },
  ): Promise<StudentContribution> {
    // Verify ownership via student_id
    const { data: stuRow } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', studentUserId)
      .maybeSingle();

    if (!stuRow?.student_id) throw new Error('Student not found');

    const { data, error } = await supabase
      .from('contributions')
      .update({
        title: updates.title,
        description: updates.description,
        updated_at: new Date().toISOString(),
      })
      .eq('contribution_id', id)
      .eq('student_id', stuRow.student_id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update contribution: ${error.message}`);

    return {
      id: data.contribution_id,
      projectId: data.team_id,
      studentId: studentUserId,
      studentName: '',
      title: data.title,
      description: data.description || '',
      uploadedAt: data.submitted_at,
      updatedAt: data.updated_at,
    };
  }

  async deleteStudentContribution(id: string, studentUserId: string): Promise<boolean> {
    const { data: stuRow } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', studentUserId)
      .maybeSingle();

    if (!stuRow?.student_id) throw new Error('Student not found');

    const { error } = await supabase
      .from('contributions')
      .delete()
      .eq('contribution_id', id)
      .eq('student_id', stuRow.student_id);

    return !error;
  }

  // ── AI Analysis (local deterministic — for team formation wizard) ─────
  async runProjectAIAnalysis(projectId: string): Promise<AIAnalysisResult> {
    // For the wizard's quick in-browser compatibility preview, use the local engine.
    // The real AI (Gemini Edge Function) is called via aiAnalysisService for all
    // deep analysis panels.
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    // Build a minimal Project shape for the local engine using available data
    const result = aiEngine.analyzeProjectTeamCompatibility(project as any);
    return result;
  }

  async getProjectAIAnalysis(_projectId: string): Promise<AIAnalysisResult | undefined> {
    // Real AI results are in the ai_analysis table, accessed via aiAnalysisService.
    return undefined;
  }

  // ── Notifications ─────────────────────────────────────────────────────
  async getNotifications(userId: string): Promise<NotificationItem[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('notification_id, type, title, body, data, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('getNotifications error:', error.message);
      return [];
    }

    return (data || []).map((n: any) => ({
      id: n.notification_id,
      userId,
      title: n.title,
      description: n.body || '',
      category: notifTypeToCategory(n.type),
      timestamp: n.created_at,
      read: n.is_read,
      actionUrl: n.data?.action_url,
      projectId: n.data?.project_id,
      projectName: n.data?.project_name,
    }));
  }

  async markNotificationRead(id: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('notification_id', id);
  }

  // ── Messages (Discussions) ────────────────────────────────────────────
  async getMessages(channelType: Message['channelType'], channelId: string): Promise<Message[]> {
    // In the Supabase schema, messages belong to discussions.
    // We find the discussion for this team/channel and load its messages.
    let discussionId: string | null = null;

    if (channelType === 'TEAM_CHAT') {
      // Find or create a default discussion for this team
      const { data: disc } = await supabase
        .from('discussions')
        .select('discussion_id')
        .eq('team_id', channelId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      discussionId = disc?.discussion_id || null;
    }

    if (!discussionId) return [];

    const { data, error } = await supabase
      .from('messages')
      .select(`
        message_id, content, message_type, created_at,
        sender_id,
        users!inner(full_name, avatar_url, role)
      `)
      .eq('discussion_id', discussionId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      console.warn('getMessages error:', error.message);
      return [];
    }

    return (data || []).map((m: any) => ({
      id: m.message_id,
      channelType,
      channelId,
      senderId: m.sender_id,
      senderName: m.users?.full_name || 'Unknown',
      senderAvatar: m.users?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.sender_id}`,
      senderRole: (m.users?.role?.toUpperCase() || 'STUDENT') as UserRole,
      text: m.content,
      timestamp: m.created_at,
    }));
  }

  async sendMessage(params: {
    channelType: Message['channelType'];
    channelId: string;
    sender: User;
    text: string;
    recipientId?: string;
  }): Promise<Message> {
    // Ensure a discussion exists for this team
    let discussionId: string | null = null;

    if (params.channelType === 'TEAM_CHAT') {
      const { data: disc } = await supabase
        .from('discussions')
        .select('discussion_id')
        .eq('team_id', params.channelId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (disc) {
        discussionId = disc.discussion_id;
      } else {
        // Create the default team discussion
        const { data: newDisc } = await supabase
          .from('discussions')
          .insert({
            team_id: params.channelId,
            title: 'Team Chat',
            created_by: params.sender.id,
            status: 'open',
          })
          .select('discussion_id')
          .single();

        discussionId = newDisc?.discussion_id || null;
      }
    }

    if (!discussionId) throw new Error('Could not find or create discussion for this channel.');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        discussion_id: discussionId,
        sender_id: params.sender.id,
        content: params.text.trim(),
        message_type: 'text',
        attachments: [],
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to send message: ${error.message}`);

    return {
      id: data.message_id,
      channelType: params.channelType,
      channelId: params.channelId,
      senderId: params.sender.id,
      senderName: params.sender.name,
      senderAvatar: params.sender.avatar,
      senderRole: params.sender.role,
      text: data.content,
      timestamp: data.created_at,
    };
  }

  // ── Collaboration Requests ────────────────────────────────────────────
  async getCollaborationRequests(userId: string): Promise<CollaborationRequest[]> {
    // Get the student_id for this user
    const { data: stuRow } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!stuRow?.student_id) return [];

    const { data, error } = await supabase
      .from('collaboration_requests')
      .select(`
        request_id, project_description, message, status, created_at, responded_at,
        sender:sender_id (student_id, users!inner(user_id, full_name, avatar_url)),
        receiver:receiver_id (student_id, users!inner(user_id, full_name, avatar_url))
      `)
      .or(`sender_id.eq.${stuRow.student_id},receiver_id.eq.${stuRow.student_id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('getCollaborationRequests error:', error.message);
      return [];
    }

    return (data || []).map((r: any) => ({
      id: r.request_id,
      senderId: r.sender?.users?.user_id || '',
      senderName: r.sender?.users?.full_name || 'Unknown',
      senderAvatar: r.sender?.users?.avatar_url || '',
      receiverId: r.receiver?.users?.user_id || '',
      projectTitle: r.project_description || '',
      suggestedRole: '',
      message: r.message || '',
      status: capitalizeStatus(r.status),
      sentAt: r.created_at,
    }));
  }

  async sendCollaborationRequest(params: {
    sender: User;
    receiverId: string;
    projectTitle: string;
    suggestedRole: string;
    message: string;
  }): Promise<CollaborationRequest> {
    // Resolve both student IDs
    const [senderStu, receiverStu] = await Promise.all([
      supabase.from('students').select('student_id').eq('user_id', params.sender.id).maybeSingle(),
      supabase.from('students').select('student_id').eq('user_id', params.receiverId).maybeSingle(),
    ]);

    const senderStudentId = senderStu.data?.student_id;
    const receiverStudentId = receiverStu.data?.student_id;

    if (!senderStudentId || !receiverStudentId) {
      throw new Error('Could not find student profiles for one or both users.');
    }

    const { data, error } = await supabase
      .from('collaboration_requests')
      .insert({
        sender_id: senderStudentId,
        receiver_id: receiverStudentId,
        project_description: params.projectTitle,
        message: params.message.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to send collaboration request: ${error.message}`);

    // Send a notification to the receiver
    await supabase.from('notifications').insert({
      user_id: params.receiverId,
      type: 'collab_request',
      title: `Collaboration Request from ${params.sender.name}`,
      body: `${params.sender.name} wants to collaborate on "${params.projectTitle}".`,
      data: {
        request_id: data.request_id,
        action_url: '/collaboration-requests',
      },
      is_read: false,
    });

    return {
      id: data.request_id,
      senderId: params.sender.id,
      senderName: params.sender.name,
      senderAvatar: params.sender.avatar,
      receiverId: params.receiverId,
      projectTitle: params.projectTitle,
      suggestedRole: params.suggestedRole,
      message: params.message,
      status: 'Pending',
      sentAt: data.created_at,
    };
  }

  async respondToCollaborationRequest(
    id: string,
    status: 'Accepted' | 'Rejected',
  ): Promise<CollaborationRequest> {
    const { data, error } = await supabase
      .from('collaboration_requests')
      .update({
        status: status.toLowerCase(),
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('request_id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to respond to request: ${error.message}`);

    return {
      id: data.request_id,
      senderId: '',
      senderName: '',
      senderAvatar: '',
      receiverId: '',
      projectTitle: data.project_description || '',
      suggestedRole: '',
      message: data.message || '',
      status,
      sentAt: data.created_at,
    };
  }

  // ── Activity Logs ─────────────────────────────────────────────────────
  async getActivityLogs(_projectId?: string): Promise<ActivityLog[]> {
    let query = supabase
      .from('audit_logs')
      .select('log_id, user_id, action, table_name, record_id, new_data, created_at, users(full_name, role)')
      .order('created_at', { ascending: false })
      .limit(50);

    const { data, error } = await query;
    if (error) {
      console.warn('getActivityLogs error:', error.message);
      return [];
    }

    return (data || []).map((l: any) => ({
      id: l.log_id,
      actorName: l.users?.full_name || 'System',
      actorRole: (l.users?.role?.toUpperCase() || 'SYSTEM'),
      action: l.action,
      object: l.table_name || '',
      timestamp: l.created_at,
      projectId: l.new_data?.team_id || undefined,
    }));
  }

  async logActivity(
    action: string,
    object: string,
    actor: { name: string; role: string },
    _projectId?: string,
  ): Promise<void> {
    // Audit logging is handled server-side by the Edge Function and backend.
    // Frontend log calls are no-ops — they don't need to write audit_logs directly
    // since RLS only allows service_role to insert into audit_logs.
    console.debug(`[audit] ${actor.role} ${actor.name}: ${action} — ${object}`);
  }
}

export const apiService = new ApiService();

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function getYearSuffix(n: number): string {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
}

function proficiencyToNumber(level: string): number {
  switch (level) {
    case 'expert':        return 95;
    case 'advanced':      return 80;
    case 'intermediate':  return 60;
    default:              return 30;
  }
}

function mimeToDocType(mimeOrName: string): ProjectDocument['type'] {
  const m = mimeOrName.toLowerCase();
  if (m.includes('pdf'))                          return 'PDF';
  if (m.includes('wordprocessingml') || m.includes('.docx') || m.includes('msword')) return 'DOCX';
  if (m.includes('presentationml') || m.includes('.pptx')) return 'PPTX';
  if (m.includes('zip') || m.includes('compressed')) return 'ZIP';
  if (m.includes('markdown') || m.endsWith('.md')) return 'Markdown';
  if (m.includes('image') || m.includes('png') || m.includes('jpg') || m.includes('jpeg')) return 'Image';
  if (m.includes('javascript') || m.includes('typescript') || m.includes('python') || m.includes('text/x-')) return 'Code';
  return 'Other';
}

function docTypeToDb(type: ProjectDocument['type']): string {
  switch (type) {
    case 'PDF':        return 'report';
    case 'DOCX':       return 'report';
    case 'PPTX':       return 'presentation';
    case 'Code':       return 'code';
    case 'Markdown':   return 'research';
    case 'Image':      return 'design';
    default:           return 'other';
  }
}

function isAnalyzableMime(mime: string): boolean {
  const m = mime.toLowerCase();
  return (
    m.startsWith('text/') ||
    m.includes('pdf') ||
    m.includes('json') ||
    m.includes('markdown')
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseSizeToBytes(size: string): number {
  const match = size.match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  switch (unit) {
    case 'KB': return Math.round(num * 1024);
    case 'MB': return Math.round(num * 1024 * 1024);
    case 'GB': return Math.round(num * 1024 * 1024 * 1024);
    default:   return Math.round(num);
  }
}

function notifTypeToCategory(type: string): NotificationItem['category'] {
  switch (type) {
    case 'team_invite':           return 'PROJECT_ASSIGNMENT';
    case 'task_assigned':         return 'ROLE_CHANGE';
    case 'message':               return 'MESSAGE';
    case 'collab_request':        return 'TEAM_UPDATE';
    case 'contribution_reviewed': return 'TEAM_UPDATE';
    case 'gap_alert':             return 'SYSTEM';
    default:                      return 'SYSTEM';
  }
}

function capitalizeStatus(s: string): 'Pending' | 'Accepted' | 'Rejected' {
  switch ((s || '').toLowerCase()) {
    case 'accepted': return 'Accepted';
    case 'rejected': return 'Rejected';
    default:         return 'Pending';
  }
}
