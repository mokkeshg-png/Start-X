import { UserRole } from '../types';

export type ScopeType =
  | 'GLOBAL_SCOPE'
  | 'OWN_PROFILE_SCOPE'
  | 'OWN_PROJECT_SCOPE'
  | 'ASSIGNED_PROJECT_SCOPE'
  | 'OWN_CONTRIBUTION_SCOPE'
  | 'OWN_DOCUMENT_SCOPE';

export type PermissionKey =
  // Admin Permissions
  | 'admin:manage-emails'
  | 'admin:view-dashboard'
  | 'admin:view-registration-status'
  | 'audit:view'
  // Teacher Permissions
  | 'teacher:view-dashboard'
  | 'teacher:create-project'
  | 'teacher:edit-project'
  | 'teacher:delete-project'
  | 'teacher:upload-document'
  | 'teacher:delete-document'
  | 'teacher:search-students'
  | 'teacher:assign-team-leader'
  | 'teacher:add-team-member'
  | 'teacher:remove-team-member'
  | 'teacher:assign-role'
  | 'teacher:run-ai-analysis'
  | 'teacher:finalize-project'
  | 'teacher:view-contributions'
  | 'teacher:view-team-progress'
  | 'teacher:message-students'
  // Student Permissions
  | 'student:view-dashboard'
  | 'student:view-own-profile'
  | 'student:edit-own-profile'
  | 'student:view-assigned-project'
  | 'student:view-team'
  | 'student:view-teammate-profile'
  | 'student:upload-own-work'
  | 'student:edit-own-work'
  | 'student:delete-own-work'
  | 'student:team-chat'
  | 'student:direct-message'
  | 'student:mentor-message'
  | 'student:view-notifications'
  | 'student:find-collaborators'
  | 'student:request-collaboration'
  // Shared Permissions
  | 'profile:edit-own'
  | 'profile:view-public'
  | 'notifications:view'
  | 'settings:manage';

export interface ResourceObject {
  type: 'project' | 'contribution' | 'document' | 'profile' | 'message';
  projectId?: string;
  ownerId?: string;
  teacherId?: string;
}
