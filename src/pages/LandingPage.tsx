import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Users,
  Brain,
  FileCheck2,
  ArrowRight,
  Lock,
  GraduationCap,
  Building2,
  CheckCircle2,
  Award,
  Layers,
  FileText
} from 'lucide-react';
import { Button } from '../components/common/Button';

export const LandingPage: React.FC = () => {
  const { brandingConfig, currentUser } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans-ui selection:bg-[#0B1E36] selection:text-white relative">
      {/* 1. Official Institutional Header */}
      <header className="h-20 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <a href="/" onClick={(e) => { e.preventDefault(); window.location.reload(); }} className="flex items-center gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded bg-white p-1 flex items-center justify-center border border-slate-200 shadow-xs shrink-0">
            <img src="/agni-logo.png" alt="AGNI COLLEGE OF TECHNOLOGY Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-[#0B1E36] tracking-tight leading-none uppercase">
                {brandingConfig.collegeName}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {brandingConfig.platformName}
            </p>
          </div>
        </a>

        {/* Center Navigation Links for Official Academic Look */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
          <a href="#overview" className="hover:text-[#0B1E36] transition-colors">Overview</a>
          <a href="#governance" className="hover:text-[#0B1E36] transition-colors">Governance & Roles</a>
          <a href="#lifecycle" className="hover:text-[#0B1E36] transition-colors">Project Lifecycle</a>
          <a href="#standards" className="hover:text-[#0B1E36] transition-colors">Academic Standards</a>
        </nav>

        {/* Right Authentication CTAs */}
        <div className="flex items-center gap-3 sm:gap-4">
          {currentUser ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/dashboard')}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
              className="bg-[#0B1E36] hover:bg-[#132c4e] text-white font-medium shadow-xs"
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-700 hover:text-[#0B1E36] px-2 py-1 transition-colors"
              >
                Sign In
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/login')}
                icon={<Lock className="w-3.5 h-3.5" />}
                iconPosition="left"
                className="bg-[#0B1E36] hover:bg-[#132c4e] text-white font-medium text-xs px-3.5 shadow-xs"
              >
                Institutional Portal
              </Button>
            </>
          )}
        </div>
      </header>

      {/* 2. Hero Section with Open Layout & Full-Width Frosted Campus Background */}
      <section id="overview" className="relative overflow-hidden border-b border-slate-200 bg-white">
        {/* Layer 1: Campus background image — sharp and clear */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/agni-entrance.png"
            alt="AGNI COLLEGE OF TECHNOLOGY Campus Entrance"
            className="w-full h-full object-cover object-center select-none"
            style={{ transform: 'scale(1.01)' }}
          />
          {/* Very subtle darkening tint so glass panel pops — NOT a white wash */}
          <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.08)' }} />
        </div>

        {/* Layer 2: Centered frosted-glass content panel */}
        <div className="relative z-10 max-w-5xl mx-auto py-16 sm:py-24 px-6 sm:px-10 flex flex-col items-center">
          <div
            className="w-full max-w-3xl flex flex-col items-center text-center px-6 sm:px-12 py-10 sm:py-14 rounded-[24px]"
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(255, 255, 255, 0.15) inset',
            }}
          >
            {/* Institutional Label / Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-white/90 border border-slate-300 text-[#0B1E36] text-xs font-semibold tracking-wide uppercase mb-6 shadow-2xs">
              <GraduationCap className="w-4 h-4 text-[#0B1E36]" />
              <span>Official Academic Platform • {brandingConfig.collegeName}</span>
            </div>

            {/* Large Editorial Academic Headline */}
            <h1 className="font-serif-academic font-semibold text-[#0B1E36] tracking-tight leading-[1.15] max-w-4xl" style={{ fontSize: 'clamp(1.75rem, 4vw, 3.25rem)' }}>
              Intelligent Project Formation & Academic Collaboration Architecture
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-700 max-w-2xl leading-relaxed font-normal">
              An institution-grade platform connecting administration-authorized faculty mentors with student project teams through deterministic requirement analysis, structured milestones, and secure role-based collaboration.
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(currentUser ? '/dashboard' : '/login')}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
                className="bg-[#0B1E36] hover:bg-[#132c4e] text-white font-semibold text-sm px-6 py-3 shadow-sm rounded cursor-pointer"
              >
                {currentUser ? 'Enter Academic Workspace' : 'Sign In with College Credentials'}
              </Button>
              <a
                href="#governance"
                className="inline-flex items-center justify-center px-6 py-3 rounded text-sm font-semibold text-slate-800 bg-white/90 border border-slate-300 hover:bg-white hover:text-[#0B1E36] transition-colors shadow-2xs"
              >
                Platform Overview
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Horizontal Full-Width Navy Key Features Section */}
      <section className="bg-[#0B1E36] text-white py-12 px-6 sm:px-10 border-y border-[#081526] shadow-inner">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="flex flex-col items-center">
            <span className="font-serif-academic text-3xl sm:text-4xl font-bold tracking-tight text-white">
              <GraduationCap className="w-8 h-8 mx-auto mb-1 text-indigo-300" />
            </span>
            <span className="mt-1 text-xs font-semibold text-slate-300 tracking-wider uppercase">
              Student Teams
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-serif-academic text-3xl sm:text-4xl font-bold tracking-tight text-white">
              <Brain className="w-8 h-8 mx-auto mb-1 text-indigo-300" />
            </span>
            <span className="mt-1 text-xs font-semibold text-slate-300 tracking-wider uppercase">
              AI-Powered Analysis
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-serif-academic text-3xl sm:text-4xl font-bold tracking-tight text-white">
              <FileCheck2 className="w-8 h-8 mx-auto mb-1 text-indigo-300" />
            </span>
            <span className="mt-1 text-xs font-semibold text-slate-300 tracking-wider uppercase">
              PRD Intelligence
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-serif-academic text-3xl sm:text-4xl font-bold tracking-tight text-white">
              <ShieldCheck className="w-8 h-8 mx-auto mb-1 text-indigo-300" />
            </span>
            <span className="mt-1 text-xs font-semibold text-slate-300 tracking-wider uppercase">
              Role-Based Access
            </span>
          </div>
        </div>
      </section>

      {/* 4. Section: Institutional Governance & 3 Official System Roles */}
      <section id="governance" className="py-16 sm:py-24 px-6 sm:px-10 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#0B1E36] uppercase tracking-widest">System Governance</span>
          <h2 className="font-serif-academic text-2xl sm:text-3xl font-bold text-[#0B1E36] mt-2">
            Role-Based Institutional Access Architecture
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
            Strict three-tier role-based access control ensuring secure academic collaboration, faculty supervision, and institution-controlled user identity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded bg-white border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs flex flex-col">
            <div className="w-10 h-10 rounded bg-[#0B1E36]/5 text-[#0B1E36] flex items-center justify-center font-bold text-sm mb-4 border border-[#0B1E36]/10">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#0B1E36]">
              Institutional Admin
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">
              Governance & Verification
            </p>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed flex-1">
              Administers authorized institutional faculty and student emails, enforces RBAC policies, reviews college-wide audit trails, and maintains system integrity.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Authorized Email Directory
            </div>
          </div>

          <div className="p-6 rounded bg-white border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs flex flex-col">
            <div className="w-10 h-10 rounded bg-[#0B1E36]/5 text-[#0B1E36] flex items-center justify-center font-bold text-sm mb-4 border border-[#0B1E36]/10">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#0B1E36]">
              Faculty / Teacher
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">
              Project Leadership & Mentorship
            </p>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed flex-1">
              Creates departmental projects, uploads official PRD requirement files, runs student compatibility assessments, appoints project team leaders, and reviews deliverables.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PRD Requirement Upload & Review
            </div>
          </div>

          <div className="p-6 rounded bg-white border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs flex flex-col">
            <div className="w-10 h-10 rounded bg-[#0B1E36]/5 text-[#0B1E36] flex items-center justify-center font-bold text-sm mb-4 border border-[#0B1E36]/10">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#0B1E36]">
              Verified Student
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">
              Execution & Collaboration
            </p>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed flex-1">
              Participates in assigned project teams, accesses project workspaces, submits work contributions, collaborates in team messaging, and receives faculty mentorship.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Scoped Workspace & Team Chat
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section: Academic Project Lifecycle & Verification */}
      <section id="lifecycle" className="py-16 sm:py-24 px-6 sm:px-10 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#0B1E36] uppercase tracking-widest">Workflow Engine</span>
            <h2 className="font-serif-academic text-2xl sm:text-3xl font-bold text-[#0B1E36] mt-2">
              Academic Project Lifecycle & Verification
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
              Standardized four-phase execution pipeline supporting structured curriculum compliance from requirement formulation to final delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded bg-white border border-slate-200 shadow-2xs text-left">
              <div className="p-2 rounded bg-slate-100 text-[#0B1E36] w-fit mb-4 border border-slate-200">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#0B1E36]">1. Requirement Compatibility Analysis</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Processes actual uploaded PRD documents, problem statements, and student skill profiles to deliver deterministic compatibility matrices with transparent skill gap metrics.
              </p>
            </div>

            <div className="p-6 rounded bg-white border border-slate-200 shadow-2xs text-left">
              <div className="p-2 rounded bg-slate-100 text-[#0B1E36] w-fit mb-4 border border-slate-200">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#0B1E36]">2. Faculty Team Formation</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Faculty mentors select verified students, designate project-level Team Leaders and specialized member roles, define milestone deliverables, and notify assigned members.
              </p>
            </div>

            <div className="p-6 rounded bg-white border border-slate-200 shadow-2xs text-left">
              <div className="p-2 rounded bg-slate-100 text-[#0B1E36] w-fit mb-4 border border-slate-200">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#0B1E36]">3. Dedicated Student Workspace</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Students access project specifications, view teammates, post runtime work progress, collaborate in team channels, and maintain direct messaging with supervising faculty.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Section: Institutional Standards & Verification */}
      <section id="standards" className="py-16 px-6 sm:px-10 max-w-5xl mx-auto w-full text-center">
        <div className="p-8 sm:p-10 rounded bg-[#0B1E36] text-white shadow-md flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 border border-white/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-serif-academic text-2xl sm:text-3xl font-bold tracking-tight">
            Official Academic Technology Infrastructure
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-3 leading-relaxed font-normal">
            Engineered exclusively for {brandingConfig.collegeName} to ensure structured project management, role accountability, and curriculum alignment across all engineering departments.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/login')}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
              className="bg-white hover:bg-slate-100 text-[#0B1E36] font-semibold text-xs px-5 py-2.5 rounded shadow-xs"
            >
              Access Portal Now
            </Button>
          </div>
        </div>
      </section>

      {/* 7. Institutional Footer */}
      <footer className="mt-auto bg-[#081220] text-slate-400 py-12 px-6 sm:px-10 border-t border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left text-xs">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded bg-white p-1 flex items-center justify-center border border-slate-200 shrink-0">
                <img src="/agni-logo.png" alt="AGNI Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-white text-sm tracking-tight uppercase">
                {brandingConfig.collegeName}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {brandingConfig.platformName} — A comprehensive academic project formation, role allocation, and requirement compatibility analysis system.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">System Portals</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">Student / Faculty Login</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">Admin Governance Portal</Link>
              </li>
              <li>
                <a href="#overview" className="hover:text-white transition-colors">System Architecture</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Institutional Policy</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Role-Based Access (RBAC)</li>
              <li>Official Email Authorization</li>
              <li>Curriculum Project Guidelines</li>
              <li>Audit Trail Logging</li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© 2026 {brandingConfig.collegeName}. All rights reserved.</p>
          <p>Official Academic Technology Deployment • v3.0</p>
        </div>
      </footer>
    </div>
  );
};
