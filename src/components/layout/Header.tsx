import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Settings,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Avatar } from '../common/Avatar';

export const Header: React.FC = () => {
  const {
    currentUser,
    logout,
    theme,
    setTheme,
    brandingConfig,
    setIsCommandPaletteOpen,
    notifications,
    markNotificationRead
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate('/login');
  };

  if (!currentUser) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0B1E36] border-b border-[#081526] px-6 flex items-center justify-between transition-colors text-white shadow-xs">
      {/* Brand & Platform */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded bg-white p-0.5 flex items-center justify-center shadow-xs shrink-0 border border-slate-200">
            <img src="/agni-logo.png" alt="AGNI Logo" className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xs font-bold text-white leading-none tracking-tight uppercase">
              {brandingConfig.platformName}
            </h1>
            <p className="text-[10px] text-blue-200 mt-0.5 font-medium">
              {brandingConfig.collegeName}
            </p>
          </div>
        </Link>
      </div>

      {/* Global Search Bar (Command Palette Trigger) */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800/80 text-slate-400 rounded-md text-xs transition-colors border border-slate-800"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search projects, students, records...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-900 border border-slate-700 rounded text-slate-400">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Real Authenticated Role Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">{currentUser.role}</span>
        </div>

        {/* System Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-medium text-emerald-400">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Portal Active</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          title="Toggle Dark / Light Mode"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 rounded-lg shadow-xl border border-slate-800 py-2 z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white">Notifications</span>
                <span className="text-[10px] text-blue-400 font-medium">{unreadCount} unread</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No notifications</div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.actionUrl) {
                          const target = n.actionUrl.replace('/projects/', '/teams/');
                          navigate(target);
                        }
                        setShowNotifications(false);
                      }}
                      className={`p-3 text-xs hover:bg-slate-800/50 cursor-pointer ${
                        !n.read ? 'bg-slate-800/40' : ''
                      }`}
                    >
                      <div className="font-semibold text-white">{n.title}</div>
                      <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-2">{n.description}</p>
                      <span className="text-[9px] text-slate-500 mt-1 block">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 text-center border-t border-slate-800">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] font-semibold text-blue-400 hover:underline"
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
            className="flex items-center gap-2 p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" isOnline />
            <div className="text-left hidden lg:block">
              <span className="block text-xs font-semibold text-white leading-tight">
                {currentUser.name}
              </span>
              <span className="block text-[10px] text-slate-400">
                {currentUser.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 rounded-lg shadow-xl border border-slate-800 py-1.5 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-800">
                <div className="font-bold text-white">{currentUser.name}</div>
                <div className="text-slate-400 text-[11px]">{currentUser.email}</div>
                {currentUser.studentId && (
                  <div className="text-blue-400 font-mono text-[10px] mt-0.5">{currentUser.studentId}</div>
                )}
              </div>
              <Link
                to="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Platform Settings</span>
              </Link>
              <div className="border-t border-slate-800 my-1" />
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-rose-400 hover:bg-rose-950/40 cursor-pointer"
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
