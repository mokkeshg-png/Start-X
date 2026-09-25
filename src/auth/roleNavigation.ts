import React from 'react';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  BarChart3,
  MessageSquare,
  CheckSquare,
  FileText,
  Network,
  Sparkles,
  AlertTriangle,
  Bell,
  Settings,
  History,
  GraduationCap,
  UserSearch,
  Send,
  Building2
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  iconName: string;
  badge?: string;
}

export const getRoleNavigation = (role: UserRole): NavItem[] => {
  switch (role) {
    case 'STAFF_COORDINATOR':
      return [
        { label: 'Coordinator Dashboard', path: '/dashboard', iconName: 'LayoutDashboard' },
        { label: 'Assigned Teams', path: '/teams', iconName: 'Users' },
        { label: 'Team Formation Wizard', path: '/teams/new', iconName: 'UserPlus' },
        { label: 'Contributions Intelligence', path: '/contributions', iconName: 'BarChart3' },
        { label: 'Discussions Workspace', path: '/discussions', iconName: 'MessageSquare' },
        { label: 'Tasks & Progress', path: '/tasks', iconName: 'CheckSquare' },
        { label: 'Document Repository', path: '/documents', iconName: 'FileText' },
        { label: 'Knowledge Exchange Map', path: '/knowledge-exchange', iconName: 'Network' },
        { label: 'AI Collective Insights', path: '/insights', iconName: 'Sparkles' },
        { label: 'Collaboration Gaps', path: '/gaps', iconName: 'AlertTriangle' },
        { label: 'Find Teammates', path: '/find-teammates', iconName: 'UserSearch' },
        { label: 'Notifications', path: '/notifications', iconName: 'Bell' },
        { label: 'Audit Activity Log', path: '/audit', iconName: 'History' },
        { label: 'Settings', path: '/settings', iconName: 'Settings' }
      ];

    case 'TEAM_LEADER':
      return [
        { label: 'Team Leader Dashboard', path: '/dashboard', iconName: 'LayoutDashboard' },
        { label: 'My Team (Team Alpha)', path: '/teams/team-alpha', iconName: 'Users' },
        { label: 'Team Tasks', path: '/tasks', iconName: 'CheckSquare' },
        { label: 'Team Discussions', path: '/discussions', iconName: 'MessageSquare' },
        { label: 'Team Documents', path: '/documents', iconName: 'FileText' },
        { label: 'Knowledge Exchange', path: '/knowledge-exchange', iconName: 'Network' },
        { label: 'Team AI Insights', path: '/insights', iconName: 'Sparkles' },
        { label: 'Team Gaps', path: '/gaps', iconName: 'AlertTriangle' },
        { label: 'Find Teammates', path: '/find-teammates', iconName: 'UserSearch' },
        { label: 'Collaboration Requests', path: '/collaboration-requests', iconName: 'Send' },
        { label: 'Private Team Chat', path: '/chat', iconName: 'MessageSquare' },
        { label: 'My Academic Profile', path: '/profile', iconName: 'GraduationCap' },
        { label: 'Settings', path: '/settings', iconName: 'Settings' }
      ];

    case 'TEAM_MEMBER':
      return [
        { label: 'Student Dashboard', path: '/dashboard', iconName: 'LayoutDashboard' },
        { label: 'My Team (Team Alpha)', path: '/teams/team-alpha', iconName: 'Users' },
        { label: 'My Assigned Tasks', path: '/tasks', iconName: 'CheckSquare' },
        { label: 'Team Discussions', path: '/discussions', iconName: 'MessageSquare' },
        { label: 'Shared Documents', path: '/documents', iconName: 'FileText' },
        { label: 'Knowledge Exchange', path: '/knowledge-exchange', iconName: 'Network' },
        { label: 'My Contributions', path: '/contributions', iconName: 'BarChart3' },
        { label: 'Find Teammates', path: '/find-teammates', iconName: 'UserSearch' },
        { label: 'Collaboration Requests', path: '/collaboration-requests', iconName: 'Send' },
        { label: 'Private Team Chat', path: '/chat', iconName: 'MessageSquare' },
        { label: 'My Academic Profile', path: '/profile', iconName: 'GraduationCap' },
        { label: 'Settings', path: '/settings', iconName: 'Settings' }
      ];

    case 'DEPARTMENT_HEAD':
      return [
        { label: 'Department Dashboard', path: '/dashboard', iconName: 'Building2' },
        { label: 'Projects Overview', path: '/teams', iconName: 'Users' },
        { label: 'Institutional Analytics', path: '/insights', iconName: 'Sparkles' },
        { label: 'Notifications', path: '/notifications', iconName: 'Bell' },
        { label: 'Audit Activity Log', path: '/audit', iconName: 'History' },
        { label: 'Settings', path: '/settings', iconName: 'Settings' }
      ];
  }
};
