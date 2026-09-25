import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const LoginPage: React.FC = () => {
  const { brandingConfig, login, register } = useApp();

  // Primary Role Switcher: 'STUDENT' vs 'TEACHER'
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');

  // Auth Mode: 'LOGIN' vs 'REGISTER'
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Admin Mode Toggle
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('3rd Year');
  const [skills, setSkills] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [bio, setBio] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setRegSuccess(null);

    try {
      if (isAdminMode) {
        // Admin Authentication
        const user = await login({ email, password });
        if (user.role !== 'ADMIN') {
          setErrorMsg(`Access Denied: This account (${user.role}) does not possess institutional administrator privileges.`);
          return;
        }
        navigate('/admin');
      } else if (authMode === 'LOGIN') {
        // Sign In
        const user = await login({ email, password });
        navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
      } else {
        // Register (pass selected role: STUDENT or TEACHER)
        const parsedSkills = selectedRole === 'STUDENT'
          ? skills.split(',').map((s) => s.trim()).filter(Boolean)
          : ['Faculty Mentor', 'Project Supervision'];

        const user = await register({
          email,
          password,
          name,
          role: selectedRole,
          department,
          year: selectedRole === 'STUDENT' ? year : undefined,
          skills: parsedSkills,
          bio: selectedRole === 'TEACHER' ? bio : undefined,
          github: selectedRole === 'STUDENT' ? github : undefined,
          linkedin: selectedRole === 'STUDENT' ? linkedin : undefined
        });

        setRegSuccess(`${selectedRole === 'TEACHER' ? 'Faculty' : 'Student'} account created successfully! Welcome ${user.name}.`);
        setTimeout(() => {
          navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans-ui selection:bg-[#0B1E36] selection:text-white relative">
      {/* Top Header Navigation Bar */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 sm:px-10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-white p-0.5 flex items-center justify-center border border-slate-200 shadow-2xs shrink-0">
            <img src="/agni-logo.png" alt="AGNI Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-[#0B1E36] tracking-tight leading-none uppercase">
              {brandingConfig.collegeName}
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
              {brandingConfig.platformName}
            </p>
          </div>
        </Link>

        {/* Top-Right Quick Access Admin Portal Icon */}
        <div>
          <button
            type="button"
            onClick={() => {
              setIsAdminMode(!isAdminMode);
              setErrorMsg('');
              setRegSuccess(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold transition-all cursor-pointer ${
              isAdminMode
                ? 'bg-[#0B1E36] text-white border-[#0B1E36] shadow-2xs'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
            }`}
            title="Institutional Admin Portal"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isAdminMode ? 'text-white' : 'text-[#0B1E36]'}`} />
            <span>Admin Portal</span>
          </button>
        </div>
      </header>

      {/* Main Single Card Authentication Container */}
      <main className="w-full flex-1 flex flex-col justify-center items-center p-6 my-8">
        <div className="w-full max-w-md mx-auto">
          {/* Institutional Branding Heading */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded bg-white p-1.5 flex items-center justify-center mx-auto shadow-2xs border border-slate-200 mb-3">
              <img
                src="/agni-logo.png"
                alt="AGNI Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="font-serif-academic text-2xl font-bold text-[#0B1E36] tracking-tight">
              {isAdminMode
                ? 'Administrator Portal'
                : selectedRole === 'TEACHER'
                ? 'Faculty Coordinator Portal'
                : 'Student Access Portal'}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">
              {brandingConfig.collegeName}
            </p>
          </div>

          {/* Unified Single White Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6 sm:p-8 space-y-5">
            {/* 1. TOP ROLE SWITCHER NAVBAR (STUDENT | FACULTY) */}
            {!isAdminMode ? (
              <div className="space-y-3">
                {/* Role Switcher */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('STUDENT');
                      setErrorMsg('');
                    }}
                    className={`py-2 rounded flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      selectedRole === 'STUDENT'
                        ? 'bg-[#0B1E36] text-white shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('TEACHER');
                      setErrorMsg('');
                    }}
                    className={`py-2 rounded flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      selectedRole === 'TEACHER'
                        ? 'bg-[#0B1E36] text-white shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Faculty / Teacher</span>
                  </button>
                </div>

                {/* Sub-mode: Sign In vs Create Account */}
                <div className="flex items-center justify-center gap-6 border-b border-slate-100 pb-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('LOGIN');
                      setErrorMsg('');
                    }}
                    className={`pb-1 transition-colors cursor-pointer ${
                      authMode === 'LOGIN'
                        ? 'text-[#0B1E36] border-b-2 border-[#0B1E36] font-bold'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('REGISTER');
                      setErrorMsg('');
                    }}
                    className={`pb-1 transition-colors cursor-pointer ${
                      authMode === 'REGISTER'
                        ? 'text-[#0B1E36] border-b-2 border-[#0B1E36] font-bold'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-[#0B1E36] shrink-0" />
                  <span>Administrator Governance Access</span>
                </div>
                <Badge variant="purple">Admin Authority</Badge>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>{errorMsg}</div>
              </div>
            )}

            {/* Success Message Alert */}
            {regSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>{regSuccess}</div>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAdminMode
                    ? 'Administrator Email'
                    : selectedRole === 'TEACHER'
                    ? 'Official Faculty Email'
                    : 'College Student Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      isAdminMode
                        ? 'admin@act.edu'
                        : selectedRole === 'TEACHER'
                        ? 'prof.name@act.edu'
                        : 'student@act.edu'
                    }
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1E36] focus:border-[#0B1E36]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1E36] focus:border-[#0B1E36]"
                  />
                </div>
              </div>

              {/* Registration Extra Fields */}
              {!isAdminMode && authMode === 'REGISTER' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {selectedRole === 'TEACHER' ? 'Full Name & Title *' : 'Full Legal Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={selectedRole === 'TEACHER' ? 'Dr. Robert Vance, Professor' : 'John Doe'}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1E36]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Department *
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0B1E36]"
                      >
                        <option value="Computer Science & Engineering">Computer Science</option>
                        <option value="Information Technology">Information Tech</option>
                        <option value="Electronics & Communication">Electronics & Comm</option>
                        <option value="Mechanical Engineering">Mechanical Eng</option>
                        <option value="Data Science & AI">Data Science & AI</option>
                      </select>
                    </div>

                    {selectedRole === 'STUDENT' ? (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Academic Year
                        </label>
                        <select
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0B1E36]"
                        >
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Specialization
                        </label>
                        <input
                          type="text"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="e.g. AI / ML"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1E36]"
                        />
                      </div>
                    )}
                  </div>

                  {selectedRole === 'STUDENT' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Skills (Comma separated)
                        </label>
                        <input
                          type="text"
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                          placeholder="React, Python, PostgreSQL, Docker"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1E36]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub</label>
                          <input
                            type="url"
                            value={github}
                            onChange={(e) => setGithub(e.target.value)}
                            placeholder="https://github.com/..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1E36]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn</label>
                          <input
                            type="url"
                            value={linkedin}
                            onChange={(e) => setLinkedin(e.target.value)}
                            placeholder="https://linkedin.com/..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1E36]"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full py-2.5 text-xs font-semibold mt-2 shadow-2xs bg-[#0B1E36] hover:bg-[#132c4e] text-white rounded cursor-pointer"
                variant="primary"
              >
                {isAdminMode
                  ? 'Sign In to Administrator Dashboard'
                  : authMode === 'LOGIN'
                  ? `Sign In as ${selectedRole === 'TEACHER' ? 'Faculty' : 'Student'}`
                  : `Create ${selectedRole === 'TEACHER' ? 'Faculty' : 'Student'} Account`}
              </Button>

              {isAdminMode && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminMode(false);
                    setErrorMsg('');
                  }}
                  className="w-full text-center text-xs text-slate-500 hover:text-[#0B1E36] pt-1 flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Student & Faculty Sign In
                </button>
              )}
            </form>

            {/* Bottom Institutional Disclaimer */}
            <div className="pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
              {isAdminMode
                ? 'Authorized access for administrative governance officers only.'
                : selectedRole === 'TEACHER'
                ? 'Faculty coordinators can create projects, review PRDs & supervise teams.'
                : 'Students access dedicated workspaces, team chats & submissions.'}
            </div>
          </div>
        </div>
      </main>

      {/* Clean Institutional Footer */}
      <footer className="py-4 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        <p>© 2026 {brandingConfig.collegeName} • Official Digital Technology Platform</p>
      </footer>
    </div>
  );
};
