import { UserRole } from '../types';

export interface NavItem {
  label: string;
  path: string;
  iconName: string;
  badge?: string;
}

export const getRoleNavigation = (role: UserRole): NavItem[] => {
  switch (role) {
    case 'ADMIN':
      return [
        { label: 'Admin Dashboard', path: '/dashboard', iconName: 'LayoutDashboard' },
        { label: 'Authorized Emails', path: '/dashboard', iconName: 'Mail' },
        { label: 'Audit Activity Log', path: '/audit', iconName: 'History' },
        { label: 'Notifications', path: '/notifications', iconName: 'Bell' },
        { label: 'Platform Settings', path: '/settings', iconName: 'Settings' }
      ];

    case 'TEACHER':
      return [
        { label: 'Teacher Dashboard', path: '/dashboard', iconName: 'LayoutDashboard' },
        { label: 'My Projects', path: '/teams', iconName: 'FolderGit2' },
        { label: 'Create Project', path: '/teams/new', iconName: 'Plus' },
        { label: 'Find Students', path: '/find-teammates', iconName: 'UserSearch' },
        { label: 'Project Chat', path: '/chat', iconName: 'MessageSquare' },
        { label: 'Notifications', path: '/notifications', iconName: 'Bell' },
        { label: 'My Profile', path: '/profile', iconName: 'GraduationCap' },
        { label: 'Settings', path: '/settings', iconName: 'Settings' }
      ];

    case 'STUDENT':
      return [
        { label: 'Student Dashboard', path: '/dashboard', iconName: 'LayoutDashboard' },
        { label: 'My Projects', path: '/teams', iconName: 'FolderGit2' },
        { label: 'My Profile', path: '/profile', iconName: 'GraduationCap' },
        { label: 'Project Chat', path: '/chat', iconName: 'MessageSquare' },
        { label: 'Find Collaborators', path: '/find-teammates', iconName: 'UserSearch' },
        { label: 'Collaboration Requests', path: '/collaboration-requests', iconName: 'Send' },
        { label: 'Notifications', path: '/notifications', iconName: 'Bell' },
        { label: 'Settings', path: '/settings', iconName: 'Settings' }
      ];
  }
};
