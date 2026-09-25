import { UserRole } from '../types';
import { PermissionKey } from './auth.types';

export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  ADMIN: [
    'admin:manage-emails',
    'admin:view-dashboard',
    'admin:view-registration-status',
    'audit:view',
    'profile:edit-own',
    'profile:view-public',
    'notifications:view',
    'settings:manage'
  ],

  TEACHER: [
    'teacher:view-dashboard',
    'teacher:create-project',
    'teacher:edit-project',
    'teacher:delete-project',
    'teacher:upload-document',
    'teacher:delete-document',
    'teacher:search-students',
    'teacher:assign-team-leader',
    'teacher:add-team-member',
    'teacher:remove-team-member',
    'teacher:assign-role',
    'teacher:run-ai-analysis',
    'teacher:finalize-project',
    'teacher:view-contributions',
    'teacher:view-team-progress',
    'teacher:message-students',
    'audit:view',
    'profile:edit-own',
    'profile:view-public',
    'notifications:view',
    'settings:manage'
  ],

  STUDENT: [
    'student:view-dashboard',
    'student:view-own-profile',
    'student:edit-own-profile',
    'student:view-assigned-project',
    'student:view-team',
    'student:view-teammate-profile',
    'student:upload-own-work',
    'student:edit-own-work',
    'student:delete-own-work',
    'student:team-chat',
    'student:direct-message',
    'student:mentor-message',
    'student:view-notifications',
    'student:find-collaborators',
    'student:request-collaboration',
    'profile:edit-own',
    'profile:view-public',
    'notifications:view',
    'settings:manage'
  ]
};
