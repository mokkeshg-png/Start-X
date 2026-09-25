import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  ShieldCheck,
  Users,
  BarChart3,
  Network,
  ArrowRight,
  GraduationCap,
  Brain,
  CheckCircle2,
  FileCheck2,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const LandingPage: React.FC = () => {
  const { brandingConfig, setCurrentUserRole } = useApp();
  const navigate = useNavigate();

  const handleDemoAccess = (role: 'STAFF_COORDINATOR' | 'TEAM_LEADER' | 'TEAM_MEMBER' | 'DEPARTMENT_HEAD') => {
    setCurrentUserRole(role);
    if (role === 'STAFF_COORDINATOR' || role === 'DEPARTMENT_HEAD') {
      navigate('/dashboard');
    } else {
      navigate('/teams/team-alpha');
    }
  };

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
          <Link
            to="/login"
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Portal Sign In
          </Link>
          <Button
            variant="ai"
            size="sm"
            onClick={() => handleDemoAccess('STAFF_COORDINATOR')}
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            Coordinator Demo
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-8 max-w-6xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-6 ai-glow-border">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Official Academic Intelligence Portal v2.4</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl">
          AI-Powered Student Project Collaboration & <span className="ai-gradient-text">Intelligence Platform</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Empowering engineering faculty to monitor student team telemetry in real time while providing students with evidence-based skill verification, automated gap detection, and AI team formation.
        </p>

        {/* Demo Roles Quick Launch Card */}
        <div className="mt-10 p-6 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl max-w-3xl w-full">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Select Institutional Persona for Live Hackathon Demonstration
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleDemoAccess('STAFF_COORDINATOR')}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-indigo-950/60 border border-slate-700 hover:border-indigo-500/60 text-left transition-all group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs mb-2">
                SC
              </div>
              <div className="font-bold text-sm text-white group-hover:text-indigo-300">
                Staff Coordinator
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Dr. Evelyn Vance</p>
              <span className="text-[10px] text-indigo-400 font-semibold block mt-2 flex items-center gap-1">
                Open Coordinator Dashboard <ChevronRight className="w-3 h-3" />
              </span>
            </button>

            <button
              onClick={() => handleDemoAccess('TEAM_LEADER')}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-purple-950/60 border border-slate-700 hover:border-purple-500/60 text-left transition-all group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs mb-2">
                TL
              </div>
              <div className="font-bold text-sm text-white group-hover:text-purple-300">
                Team Leader
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Alice Johnson (Team Alpha)</p>
              <span className="text-[10px] text-purple-400 font-semibold block mt-2 flex items-center gap-1">
                Open Team Alpha Intelligence <ChevronRight className="w-3 h-3" />
              </span>
            </button>

            <button
              onClick={() => handleDemoAccess('TEAM_MEMBER')}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/60 text-left transition-all group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-2">
                TM
              </div>
              <div className="font-bold text-sm text-white group-hover:text-emerald-300">
                Student Member
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Bob Smith (Backend Lead)</p>
              <span className="text-[10px] text-emerald-400 font-semibold block mt-2 flex items-center gap-1">
                Open Verified Student Profile <ChevronRight className="w-3 h-3" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-16 px-8 max-w-6xl mx-auto w-full border-t border-slate-800/60">
        <h2 className="text-2xl font-bold text-white text-center mb-12">
          Academic Project Monitoring & Intelligence Capabilities
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-left">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-4">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">AI Collaboration Gap Detection</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Automatically flags frontend/backend dependency bottlenecks, inactive member contributions, and unresolved technical discussions before project deadlines.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-left">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-4">
              <Network className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Knowledge Exchange Network Graph</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Interactive node-link graph visualizing communication flows, schema updates, API documentation exchanges, and isolated team member warnings.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-left">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-4">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Evidence-Based Skill Verification</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Traces student skill proficiencies directly to verified code commits, submitted PRD documents, OpenAPI schemas, and automated test suites.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-8 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>© 2026 {brandingConfig.collegeName} • Official Digital Technology Platform</p>
        <p className="mt-1 text-[11px] text-slate-600">Built for Hackathon & Academic Project Demonstration</p>
      </footer>
    </div>
  );
};
