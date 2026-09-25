import { User, Project } from '../types';
import { PermissionKey, ResourceObject } from './auth.types';
import { ROLE_PERMISSIONS } from './permissions';

/**
 * Core authorization function — default-deny behavior.
 * Checks: CURRENT USER + ROLE + RESOURCE + OWNERSHIP + PROJECT MEMBERSHIP + ACTION = ALLOW/DENY
 */
export const can = (
  user: User | null,
  permission: PermissionKey,
  resource?: ResourceObject
): boolean => {
  if (!user || !user.role) return false;

  // 1. Role-level permission check
  const allowedPermissions = ROLE_PERMISSIONS[user.role] || [];
  if (!allowedPermissions.includes(permission)) {
    return false;
  }

  // If no specific resource context is passed, role check is sufficient
  if (!resource) return true;

  // 2. Resource ownership & Scope enforcement
  if (user.role === 'ADMIN') {
    // Admin has system-level access but NOT student/teacher project editing
    if (permission.startsWith('teacher:') || permission.startsWith('student:')) {
      return false;
    }
    return true;
  }

  if (user.role === 'TEACHER') {
    // Teacher can only manage their own projects
    if (resource.projectId && resource.teacherId) {
      if (resource.teacherId !== user.id) {
        return false; // Cannot access another teacher's project
      }
    }
    return true;
  }

  if (user.role === 'STUDENT') {
    // Students can only access own profile and assigned project data
    if (resource.type === 'profile' && resource.ownerId) {
      if (resource.ownerId !== user.id && permission !== 'profile:view-public' && permission !== 'student:view-teammate-profile') {
        return false;
      }
    }

    // Students can only edit/delete their own contributions
    if (resource.type === 'contribution' && resource.ownerId) {
      if (resource.ownerId !== user.id) {
        return false;
      }
    }

    return true;
  }

  return true;
};

// Convenience Authorization Helpers
export const canViewProject = (user: User, project: Project): boolean => {
  if (user.role === 'ADMIN') return true;
  if (user.role === 'TEACHER') return project.teacherId === user.id;
  if (user.role === 'STUDENT') {
    return project.teamLeaderId === user.id || project.memberIds.includes(user.id);
  }
  return false;
};

export const canManageProject = (user: User, project: Project): boolean => {
  return user.role === 'TEACHER' && project.teacherId === user.id;
};

export const canCreateProject = (user: User): boolean => {
  return can(user, 'teacher:create-project');
};

export const canEditProject = (user: User, projectTeacherId: string): boolean => {
  return can(user, 'teacher:edit-project', { type: 'project', teacherId: projectTeacherId });
};

export const canManageTeam = (user: User, projectTeacherId: string): boolean => {
  return can(user, 'teacher:add-team-member', { type: 'project', teacherId: projectTeacherId });
};

export const canAssignRoles = (user: User, projectTeacherId: string): boolean => {
  return can(user, 'teacher:assign-role', { type: 'project', teacherId: projectTeacherId });
};

export const canUploadWork = (user: User, ownerId: string): boolean => {
  return can(user, 'student:upload-own-work', { type: 'contribution', ownerId });
};

export const canDeleteWork = (user: User, ownerId: string): boolean => {
  return can(user, 'student:delete-own-work', { type: 'contribution', ownerId });
};

export const canRunAIAnalysis = (user: User): boolean => {
  return can(user, 'teacher:run-ai-analysis');
};

export const canViewAdminDashboard = (user: User): boolean => {
  return can(user, 'admin:view-dashboard');
};

export const canManageEmails = (user: User): boolean => {
  return can(user, 'admin:manage-emails');
};
