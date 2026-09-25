import { UserRole } from '../types';

export type ScopeType =
  | 'GLOBAL_SCOPE'
  | 'DEPARTMENT_SCOPE'
  | 'ASSIGNED_TEAM_SCOPE'
  | 'OWN_PROFILE_SCOPE'
  | 'OWN_TASK_SCOPE'
  | 'OWN_DOCUMENT_SCOPE'
  | 'OWN_CONTRIBUTION_SCOPE'
  | 'OWN_DISCUSSION_SCOPE';

export type PermissionKey =
  // Dashboard Permissions
  | 'dashboard:view-staff'
  | 'dashboard:view-leader'
  | 'dashboard:view-member'
  | 'dashboard:view-department'
  // Team Permissions
  | 'team:create'
  | 'team:view-assigned'
  | 'team:view-own'
  | 'team:view-department'
  | 'team:edit'
  | 'team:delete'
  | 'team:export'
  // Member & Role Permissions
  | 'member:add'
  | 'member:remove'
  | 'member:assign-role'
  | 'member:view-roster'
  // Task Permissions
  | 'task:create'
  | 'task:edit-any'
  | 'task:edit-own'
  | 'task:delete'
  | 'task:assign'
  | 'task:change-status'
  // Document Permissions
  | 'document:upload'
  | 'document:view-team'
  | 'document:view-coordinator-only'
  | 'document:delete'
  | 'document:analyze-consistency'
  // Discussion & Chat Permissions
  | 'discussion:create'
  | 'discussion:view'
  | 'discussion:reply'
  | 'chat:access-own-team'
  // Contribution Permissions
  | 'contribution:view-own'
  | 'contribution:view-team'
  | 'contribution:view-staff-analytics'
  // AI & Gap Permissions
  | 'ai:run-team-analysis'
  | 'ai:view-staff-insights'
  | 'ai:view-student-insights'
  | 'gap:view'
  | 'gap:resolve'
  // Student Profile & Teammate Discovery
  | 'profile:edit-own'
  | 'profile:view-public'
  | 'profile:view-private-staff'
  | 'teammate:search'
  | 'collaboration:request'
  | 'collaboration:respond'
  // System & Audit Permissions
  | 'settings:manage'
  | 'audit:view';

export interface ResourceObject {
  type: 'team' | 'task' | 'document' | 'discussion' | 'gap' | 'profile' | 'report';
  teamId?: string;
  ownerId?: string;
  assignedToId?: string;
  department?: string;
}
