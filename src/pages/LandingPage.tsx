import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  ShieldCheck,
  Users,
  Brain,
  FileCheck2,
  ArrowRight,
  Lock
} from 'lucide-react';
import { Button } from '../components/common/Button';

export const LandingPage: React.FC = () => {
  const { brandingConfig, currentUser } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Official Header */}
      <header className="h-20 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 font-bold flex items-center justify-center text-white text-sm tracking-wider shadow-lg shadow-indigo-600/30">
            {brandingConfig.logoText}
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">
              {brandingConfig.platformName}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">{brandingConfig.collegeName}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {currentUser ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/dashboard')}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/login')}
                icon={<Lock className="w-4 h-4" />}
                iconPosition="left"
              >
                Institutional Portal
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-8 max-w-6xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-6 ai-glow-border">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Official Academic Project Management System v3.0</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl">
          College Project Formation & <span className="ai-gradient-text">AI Compatibility Platform</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Admin-controlled authorization, faculty-led project creation with uploaded PRD requirement analysis, deterministic team compatibility matching, and dedicated student collaboration workspaces.
        </p>

        {/* Action CTA */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(currentUser ? '/dashboard' : '/login')}
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            {currentUser ? 'Enter Dashboard' : 'Sign In with College Credentials'}
          </Button>
        </div>

        {/* Institutional Roles Overview Card */}
        <div className="mt-12 p-6 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl max-w-3xl w-full">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Institutional Access Control — 3 Official Roles
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-left">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs mb-2">
                AD
              </div>
              <div className="font-bold text-sm text-white">
                Institutional Admin
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Authorizes faculty and student institutional emails for platform access.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-left">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs mb-2">
                TC
              </div>
              <div className="font-bold text-sm text-white">
                Faculty / Teacher
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Creates projects, uploads PRDs, assigns team leaders, and reviews compatibility.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-left">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-2">
                ST
              </div>
              <div className="font-bold text-sm text-white">
                Verified Student
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Collaborates on projects, submits work contributions, and connects with teammates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-16 px-8 max-w-6xl mx-auto w-full border-t border-slate-800/60">
        <h2 className="text-2xl font-bold text-white text-center mb-12">
          Academic Project Lifecycle & Verification
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-left">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-4">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">AI Requirement-Based Compatibility</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Analyzes actual uploaded PRD documents, project problem statements, and real registered student profiles to produce transparent, explainable compatibility reports with missing skill gap alerts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-left">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Faculty Team Formation</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Teachers search real registered students, assign project-level Team Leaders and member roles (predefined or custom), upload project requirement files, and notify assigned students.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-left">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-4">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Dedicated Student Workspace</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Assigned students receive project notifications, view teammates and roles, submit runtime contributions, collaborate in scoped team chats, and message assigned faculty mentors.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-8 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>© 2026 {brandingConfig.collegeName} • Official Digital Technology Platform</p>
        <p className="mt-1 text-[11px] text-slate-600">Enterprise College Project Management Architecture</p>
      </footer>
    </div>
  );
};
