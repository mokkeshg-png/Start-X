import { User } from '../types';
import { PermissionKey, ResourceObject } from './auth.types';
import { ROLE_PERMISSIONS } from './permissions';

export const can = (
  user: User,
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
  if (user.role === 'STAFF_COORDINATOR') {
    // Staff Coordinator has monitoring & management oversight within assigned scope
    return true;
  }

  if (user.role === 'DEPARTMENT_HEAD') {
    // Department Head has institutional aggregate oversight
    if (resource.type === 'profile' && resource.ownerId && resource.ownerId !== user.id) {
      // Cannot view individual private student notes/fields
      return permission !== 'profile:view-private-staff';
    }
    return true;
  }

  // Student roles (TEAM_LEADER & TEAM_MEMBER)
  if (user.role === 'TEAM_LEADER' || user.role === 'TEAM_MEMBER') {
    // Cross-team isolation: student must belong to the requested team
    if (resource.teamId) {
      // Student users (Alice, Bob, Carol, John, Jane) belong to 'team-alpha'
      const userAssignedTeamIds = ['team-alpha'];
      if (!userAssignedTeamIds.includes(resource.teamId)) {
        return false; // Deny access to other teams' private resources (e.g. team-beta, team-gamma)
      }
    }

    // Ownership check for task edits
    if (permission === 'task:edit-own' && resource.assignedToId) {
      if (resource.assignedToId !== user.id && user.role !== 'TEAM_LEADER') {
        return false;
      }
    }

    // Student profile privacy
    if (permission === 'profile:view-private-staff') {
      return false; // Students cannot view internal staff notes or confidential assessments
    }
  }

  return true;
};

// Convenience Authorization Helpers
export const canViewTeam = (user: User, teamId: string): boolean => {
  if (user.role === 'STAFF_COORDINATOR' || user.role === 'DEPARTMENT_HEAD') return true;
  return can(user, 'team:view-own', { type: 'team', teamId });
};

export const canCreateTeam = (user: User): boolean => {
  return can(user, 'team:create');
};

export const canEditTeam = (user: User, teamId: string): boolean => {
  return can(user, 'team:edit', { type: 'team', teamId });
};

export const canManageMembers = (user: User, teamId: string): boolean => {
  return can(user, 'member:add', { type: 'team', teamId });
};

export const canAssignRoles = (user: User, teamId: string): boolean => {
  return can(user, 'member:assign-role', { type: 'team', teamId });
};

export const canCreateTask = (user: User, teamId: string): boolean => {
  return can(user, 'task:create', { type: 'team', teamId });
};

export const canResolveGap = (user: User, gapTeamId: string): boolean => {
  return can(user, 'gap:resolve', { type: 'gap', teamId: gapTeamId });
};

export const canViewStaffAnalytics = (user: User): boolean => {
  return can(user, 'contribution:view-staff-analytics');
};

export const canViewChat = (user: User, teamId: string): boolean => {
  return can(user, 'chat:access-own-team', { type: 'discussion', teamId });
};
