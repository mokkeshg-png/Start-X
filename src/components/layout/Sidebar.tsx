import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavLink, useLocation } from 'react-router-dom';
import { getRoleNavigation } from '../../auth/roleNavigation';
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
  ShieldCheck,
  UserSearch,
  Send,
  Building2
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentUser } = useApp();
  const location = useLocation();

  const iconMap: Record<string, React.ReactNode> = {
    LayoutDashboard: <LayoutDashboard className="w-4 h-4" />,
    Users: <Users className="w-4 h-4" />,
    UserPlus: <UserPlus className="w-4 h-4" />,
    BarChart3: <BarChart3 className="w-4 h-4" />,
    MessageSquare: <MessageSquare className="w-4 h-4" />,
    CheckSquare: <CheckSquare className="w-4 h-4" />,
    FileText: <FileText className="w-4 h-4" />,
    Network: <Network className="w-4 h-4" />,
    Sparkles: <Sparkles className="w-4 h-4" />,
    AlertTriangle: <AlertTriangle className="w-4 h-4" />,
    UserSearch: <UserSearch className="w-4 h-4" />,
    Bell: <Bell className="w-4 h-4" />,
    History: <History className="w-4 h-4" />,
    Settings: <Settings className="w-4 h-4" />,
    Send: <Send className="w-4 h-4" />,
    GraduationCap: <GraduationCap className="w-4 h-4" />,
    Building2: <Building2 className="w-4 h-4" />
  };

  const navItems = getRoleNavigation(currentUser.role);

  const getRoleHeaderLabel = () => {
    switch (currentUser.role) {
      case 'STAFF_COORDINATOR': return 'STAFF MONITORING MODE';
      case 'TEAM_LEADER': return 'TEAM LEADER WORKSPACE';
      case 'TEAM_MEMBER': return 'STUDENT COLLABORATION';
      case 'DEPARTMENT_HEAD': return 'DEPARTMENT OVERVIEW';
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-colors">
      {/* Role Banner Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{getRoleHeaderLabel()}</span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
          Role: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{currentUser.role.replace('_', ' ')}</span>
        </p>
      </div>

      {/* Dynamic Role-Based Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path) && item.path !== '/teams');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-smooth ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <span className="shrink-0">{iconMap[item.iconName]}</span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Identity Card */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700 dark:text-slate-300">RBAC Telemetry v2.4</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
        <p className="mt-0.5 text-[10px] text-slate-400">Strict Scope & Permission Engine</p>
      </div>
    </aside>
  );
};
