import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Settings,
  HelpCircle,
  GraduationCap,
  ShieldAlert
} from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const {
    currentUser,
    setCurrentUserRole,
    theme,
    setTheme,
    brandingConfig,
    setIsCommandPaletteOpen,
    notifications,
    markNotificationRead
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roles: { role: UserRole; label: string }[] = [
    { role: 'STAFF_COORDINATOR', label: 'Staff Coordinator' },
    { role: 'TEAM_LEADER', label: 'Team Leader (Alice)' },
    { role: 'TEAM_MEMBER', label: 'Team Member (Bob)' },
    { role: 'DEPARTMENT_HEAD', label: 'Department Head' }
  ];

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between transition-colors">
      {/* Brand & Platform */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 font-bold flex items-center justify-center text-xs tracking-wider shadow-sm group-hover:scale-105 transition-transform">
            {brandingConfig.logoText}
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-none tracking-tight">
              {brandingConfig.platformName}
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {brandingConfig.collegeName}
            </p>
          </div>
        </Link>
      </div>

      {/* Global Search Bar (Command Palette Trigger) */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 text-slate-500 dark:text-slate-400 rounded-lg text-xs transition-colors border border-slate-200/60 dark:border-slate-700/60"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search teams, students, projects, tasks...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-500">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSelector(!showRoleSelector)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{currentUser.role.replace('_', ' ')}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showRoleSelector && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Demo Persona
              </div>
              {roles.map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    setCurrentUserRole(r.role);
                    setShowRoleSelector(false);
                    if (r.role === 'STAFF_COORDINATOR' || r.role === 'DEPARTMENT_HEAD') {
                      navigate('/dashboard');
                    } else {
                      navigate('/teams/team-alpha');
                    }
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between ${
                    currentUser.role === r.role ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{r.label}</span>
                  {currentUser.role === r.role && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Status Indicator */}
        <Badge variant="ai" size="sm" icon={<Sparkles className="w-3 h-3 text-cyan-400 hidden sm:inline" />}>
          <span className="hidden sm:inline">AI Telemetry Active</span>
        </Badge>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark / Light Mode"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                <span className="text-[10px] text-indigo-500 font-medium">{unreadCount} new</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id);
                      if (n.actionUrl) navigate(n.actionUrl);
                      setShowNotifications(false);
                    }}
                    className={`p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${
                      !n.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <div className="font-semibold text-slate-900 dark:text-white">{n.title}</div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{n.description}</p>
                    <span className="text-[9px] text-slate-400 mt-1 block">{n.timestamp}</span>
                  </div>
                ))}
              </div>
              <div className="p-2 text-center border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View All Notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" isOnline />
            <div className="text-left hidden lg:block">
              <span className="block text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {currentUser.name}
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                {currentUser.department}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
                <div className="text-slate-500 text-[11px]">{currentUser.email}</div>
              </div>
              <Link
                to="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>My Academic Profile</span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Platform Settings</span>
              </Link>
              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
