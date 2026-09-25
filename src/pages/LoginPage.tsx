import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp, SYSTEM_ADMIN_USER } from '../context/AppContext';
import { GraduationCap, Lock, Mail, ShieldAlert, ArrowRight, UserCheck, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '../components/common/Button';
import { UserRole } from '../types';
import { apiService } from '../services/apiService';
import { clientStorage } from '../storage/clientStorage';

export const LoginPage: React.FC = () => {
  const { brandingConfig, setCurrentUser, setCurrentUserRole, showToast } = useApp();
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Register form state
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regDept, setRegDept] = useState('Computer Science & Engineering');
  const [regYear, setRegYear] = useState('3rd Year');
  const [regBio, setRegBio] = useState('');
  const [regSkills, setRegSkills] = useState('');
  const [regGithub, setRegGithub] = useState('');
  const [regLinkedin, setRegLinkedin] = useState('');
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const emailClean = loginEmail.trim().toLowerCase();

      // Check if admin
      if (emailClean === SYSTEM_ADMIN_USER.email.toLowerCase() || emailClean === 'admin') {
        setCurrentUser(SYSTEM_ADMIN_USER);
        showToast('Administrator Authenticated', 'Logged in as Institutional Administrator.', 'success');
        navigate('/dashboard');
        return;
      }

      // Check existing registered users
      const users = clientStorage.getUsers();
      const user = users.find(
        (u) => u.email.toLowerCase() === emailClean || (u.studentId && u.studentId.toLowerCase() === emailClean)
      );

      if (user) {
        setCurrentUser(user);
        showToast('Login Successful', `Welcome back, ${user.name}!`, 'success');
        navigate('/dashboard');
        return;
      }

      // If user doesn't exist, check if email is pre-authorized by Admin
      const auth = await apiService.checkEmailAuthorization(emailClean);
      if (auth) {
        // Pre-authorized but hasn't registered yet!
        setTab('REGISTER');
        setRegEmail(auth.email);
        setErrorMsg(`Your email is authorized as ${auth.role}. Please complete your registration below.`);
      } else {
        setErrorMsg('This email is not authorized by the College Administrator. Please contact your administrator to be added.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setRegSuccess(null);

    try {
      const parsedSkills = regSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const newUser = await apiService.registerUser({
        email: regEmail,
        name: regName,
        department: regDept,
        year: regYear,
        bio: regBio,
        skills: parsedSkills,
        github: regGithub,
        linkedin: regLinkedin
      });

      setCurrentUser(newUser);
      setRegSuccess(`Registration successful! Generated permanent Student ID: ${newUser.studentId || 'N/A'}`);
      showToast('Registration Complete', `Welcome ${newUser.name}!`, 'success');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSelect = (role: UserRole) => {
    setCurrentUserRole(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex selection:bg-indigo-600 selection:text-white relative bg-slate-950">
      {/* Background Hero Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/college-building.jpg"
          alt="College Campus"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-blue-950/40"></div>
      </div>

      {/* Main Authentication UI - Centered over background */}
      <div className="w-full flex flex-col justify-center items-center p-6 text-slate-100 relative z-10">
        <div className="w-full max-w-lg">
          {/* Platform Branding Logo */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 font-extrabold text-white text-xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30 mb-3">
              {brandingConfig.logoText}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{brandingConfig.platformName}</h1>
            <p className="text-xs text-slate-400 mt-1">{brandingConfig.collegeName} • Official Project Portal</p>
          </div>

          {/* Main Card */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setTab('LOGIN'); setErrorMsg(''); }}
                className={`py-2 rounded-lg transition-all ${
                  tab === 'LOGIN' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab('REGISTER'); setErrorMsg(''); }}
                className={`py-2 rounded-lg transition-all ${
                  tab === 'REGISTER' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Complete Registration
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>{errorMsg}</div>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>{regSuccess}</div>
              </div>
            )}

            {tab === 'LOGIN' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Official College Email or Student ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. admin@apex.edu, prof.sharma@apex.edu, or STU-2026-1042"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Use your admin-approved email or unique Student ID.
                  </span>
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
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full py-2.5 text-xs font-semibold"
                  variant="primary"
                >
                  Sign In to Institutional Portal
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pre-Approved College Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. rahul.verma@apex.edu"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Must be pre-approved by the Admin.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Department *
                    </label>
                    <select
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Computer Science & Engineering">Computer Science</option>
                      <option value="Information Technology">Information Tech</option>
                      <option value="Electronics & Communication">Electronics & Comm</option>
                      <option value="Mechanical Engineering">Mechanical Eng</option>
                      <option value="Data Science & AI">Data Science & AI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Academic Year
                    </label>
                    <select
                      value={regYear}
                      onChange={(e) => setRegYear(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={regSkills}
                    onChange={(e) => setRegSkills(e.target.value)}
                    placeholder="e.g. React, Python, PostgreSQL, Docker"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">GitHub URL</label>
                    <input
                      type="url"
                      value={regGithub}
                      onChange={(e) => setRegGithub(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={regLinkedin}
                      onChange={(e) => setRegLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full py-2.5 text-xs font-semibold mt-2"
                  variant="primary"
                >
                  Create Account & Generate Student ID
                </Button>
              </form>
            )}

            {/* Quick Demo Access Bar */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" /> Evaluation Quick Access Personas
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoSelect('ADMIN')}
                  className="px-2.5 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-left text-xs text-slate-200 transition-colors"
                >
                  <span className="font-semibold block text-indigo-300">1. Admin</span>
                  <span className="text-[10px] text-slate-400">Dr. Pendelton</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSelect('TEACHER')}
                  className="px-2.5 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-left text-xs text-slate-200 transition-colors"
                >
                  <span className="font-semibold block text-purple-300">2. Teacher</span>
                  <span className="text-[10px] text-slate-400">Prof. Sharma</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSelect('STUDENT')}
                  className="px-2.5 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-left text-xs text-slate-200 transition-colors"
                >
                  <span className="font-semibold block text-emerald-300">3. Student</span>
                  <span className="text-[10px] text-slate-400">Rahul Verma</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
