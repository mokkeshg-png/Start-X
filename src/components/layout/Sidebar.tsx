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
  Building2,
  Mail,
  FolderGit2,
  Plus,
  HelpCircle
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentUser } = useApp();
  const location = useLocation();

  if (!currentUser) {
    return null;
  }

  const iconMap: Record<string, React.ReactNode> = {
    LayoutDashboard: <LayoutDashboard className="w-4 h-4" />,
    FolderGit2: <FolderGit2 className="w-4 h-4" />,
    Plus: <Plus className="w-4 h-4" />,
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
    Building2: <Building2 className="w-4 h-4" />,
    Mail: <Mail className="w-4 h-4" />
  };

  const navItems = getRoleNavigation(currentUser.role);

  const getRoleHeaderLabel = () => {
    switch (currentUser.role) {
      case 'ADMIN': return 'ADMINISTRATION AUTHORITY';
      case 'TEACHER': return 'FACULTY COORDINATOR';
      case 'STUDENT': return 'STUDENT WORKSPACE';
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 transition-colors text-slate-800">
      {/* Role Banner Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/60">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0B1E36] tracking-wider uppercase">
          <ShieldCheck className="w-4 h-4 text-[#0B1E36]" />
          <span>{getRoleHeaderLabel()}</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
          Authority: <span className="font-semibold text-[#0B1E36]">{currentUser.role}</span>
        </p>
      </div>

      {/* Dynamic Role-Based Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path + item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded transition-all ${
                  isActive
                    ? 'bg-slate-100 text-[#0B1E36] font-bold border-l-4 border-[#0B1E36] shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#0B1E36] font-medium'
                }`
              }
            >
              <span className="shrink-0">{iconMap[item.iconName] || <LayoutDashboard className="w-4 h-4" />}</span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Identity Section */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/40 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">Access Control</span>
          <span className="font-mono text-[9px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            ENFORCED
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">Institutional Platform v3.0</p>
      </div>
    </aside>
  );
};
