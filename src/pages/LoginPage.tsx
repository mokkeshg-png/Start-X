import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { GraduationCap, Lock, Mail, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { Button } from '../components/common/Button';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { brandingConfig, setCurrentUserRole, showToast } = useApp();
  const [email, setEmail] = useState('evelyn.vance@apex.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast("Authentication Successful", "Welcome back to APEX Project Intelligence.", "success");
      navigate('/dashboard');
    }, 400);
  };

  const handleDemoSelect = (role: UserRole) => {
    setCurrentUserRole(role);
    if (role === 'STAFF_COORDINATOR' || role === 'DEPARTMENT_HEAD') {
      navigate('/dashboard');
    } else {
      navigate('/teams/team-alpha');
    }
  };

  return (
    <div className="min-h-screen flex selection:bg-indigo-600 selection:text-white relative">
      
      {/* Background Hero Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/college-building.jpg" 
          alt="College Campus" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Subtle overlay to ensure text/UI readability with the Deep Navy theme */}
        <div className="absolute inset-0 bg-blue-950/80 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-slate-950/70"></div>
      </div>

      {/* Main Authentication UI - Centered over background */}
      <div className="w-full flex flex-col justify-center items-center p-6 text-slate-100 relative z-10">
        <div className="w-full max-w-md">
          {/* Platform Branding Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 font-extrabold text-white text-xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30 mb-3">
              {brandingConfig.logoText}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{brandingConfig.platformName}</h1>
            <p className="text-xs text-slate-400 mt-1">{brandingConfig.collegeName} • Official Single Sign-On Portal</p>
          </div>

          {/* Main Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
            <h2 className="text-lg font-bold text-white text-center">Institutional Portal Login</h2>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  College Email or Student ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. evelyn.vance@apex.edu or STU-2026-041"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Remember session</span>
                </label>
                <Link to="/forgot-password" className="text-indigo-400 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full py-2.5 text-xs font-semibold"
                variant="primary"
              >
                Sign In to Platform
              </Button>
            </form>

            {/* Demo Roles Access */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" /> Hackathon Demo Quick Access
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDemoSelect('STAFF_COORDINATOR')}
                  className="px-3 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-left text-xs text-slate-200 transition-colors"
                >
                  <span className="font-semibold block text-indigo-300">Staff Coordinator</span>
                  <span className="text-[10px] text-slate-400">Dr. Evelyn Vance</span>
                </button>
                <button
                  onClick={() => handleDemoSelect('TEAM_LEADER')}
                  className="px-3 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-left text-xs text-slate-200 transition-colors"
                >
                  <span className="font-semibold block text-purple-300">Team Leader</span>
                  <span className="text-[10px] text-slate-400">Alice Johnson</span>
                </button>
                <button
                  onClick={() => handleDemoSelect('TEAM_MEMBER')}
                  className="px-3 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-left text-xs text-slate-200 transition-colors"
                >
                  <span className="font-semibold block text-emerald-300">Student Member</span>
                  <span className="text-[10px] text-slate-400">Bob Smith</span>
                </button>
                <button
                  onClick={() => handleDemoSelect('DEPARTMENT_HEAD')}
                  className="px-3 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-left text-xs text-slate-200 transition-colors"
                >
                  <span className="font-semibold block text-cyan-300">Department Head</span>
                  <span className="text-[10px] text-slate-400">Prof. Pendelton</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
