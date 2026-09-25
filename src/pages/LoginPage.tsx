import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Lock, Mail, CheckCircle2, AlertCircle, ShieldCheck, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const LoginPage: React.FC = () => {
  const { brandingConfig, login, register } = useApp();
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'ADMIN_LOGIN'>('LOGIN');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Register form state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
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
      const user = await login({
        email: loginEmail,
        password: loginPassword
      });

      if (tab === 'ADMIN_LOGIN' && user.role !== 'ADMIN') {
        setErrorMsg(`Access Denied: This account (${user.role}) does not possess institutional administrator privileges.`);
        return;
      }

      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
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

      const user = await register({
        email: regEmail,
        password: regPassword,
        name: regName,
        department: regDept,
        year: regYear,
        bio: regBio,
        skills: parsedSkills,
        github: regGithub,
        linkedin: regLinkedin
      });

      setRegSuccess(`Registration successful! Welcome ${user.name}.`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex selection:bg-indigo-600 selection:text-white relative bg-slate-950">
      {/* Subtle Top-Right Quick Access Admin Portal Icon */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={() => {
            setTab(tab === 'ADMIN_LOGIN' ? 'LOGIN' : 'ADMIN_LOGIN');
            setErrorMsg('');
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all backdrop-blur-md cursor-pointer ${
            tab === 'ADMIN_LOGIN'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 font-semibold'
              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white shadow-sm'
          }`}
          title="Institutional Admin Portal"
        >
          <ShieldCheck className={`w-3.5 h-3.5 ${tab === 'ADMIN_LOGIN' ? 'text-white' : 'text-indigo-400'}`} />
          <span>Admin Portal</span>
        </button>
      </div>

      {/* Real AGNI COLLEGE OF TECHNOLOGY Campus Background Photo */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/agni-campus.jpg"
          alt="AGNI COLLEGE OF TECHNOLOGY Campus"
          className="absolute inset-0 w-full h-full object-cover object-center transform scale-100 transition-transform duration-700"
        />
        {/* Subtle elegant gradient overlay for perfect readability without obscuring the campus */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/45"></div>
      </div>

      {/* Main Authentication UI - Centered over background */}
      <div className="w-full flex flex-col justify-center items-center p-6 text-slate-100 relative z-10 my-auto">
        <div className="w-full max-w-lg">
          {/* Official AGNI COLLEGE OF TECHNOLOGY Branding Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white/95 backdrop-blur-md p-1.5 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-950/50 border border-white/40 mb-3 hover:scale-105 transition-transform">
              <img
                src="/agni-logo.png"
                alt="AGNI COLLEGE OF TECHNOLOGY Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
              AGNI COLLEGE OF TECHNOLOGY
            </h1>
            <p className="text-xs font-semibold text-indigo-300 mt-1 uppercase tracking-wider drop-shadow-sm">
              INTELLIGENT PROJECT COLLABORATION PLATFORM
            </p>
          </div>

          {/* Main Glassmorphism Card */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-2xl shadow-slate-950/80 p-6 sm:p-8 space-y-6">
            {/* Standard Tabs or Admin Banner */}
            {tab !== 'ADMIN_LOGIN' ? (
              <div className="grid grid-cols-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setTab('LOGIN'); setErrorMsg(''); }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    tab === 'LOGIN' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('REGISTER'); setErrorMsg(''); }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    tab === 'REGISTER' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-indigo-950/80 border border-indigo-700/60 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-indigo-200 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Institutional Administrator Portal</span>
                </div>
                <Badge variant="purple">Admin Authority</Badge>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>{errorMsg}</div>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>{regSuccess}</div>
              </div>
            )}

            {tab === 'LOGIN' || tab === 'ADMIN_LOGIN' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    {tab === 'ADMIN_LOGIN' ? 'Administrator Email Address' : 'Official College Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={tab === 'ADMIN_LOGIN' ? 'admin@act.edu' : 'yourname@act.edu'}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950/90 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950/90 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full py-2.5 text-xs font-semibold shadow-lg shadow-indigo-600/20"
                  variant="primary"
                >
                  {tab === 'ADMIN_LOGIN' ? 'Sign In to Admin Dashboard' : 'Sign In to Institutional Portal'}
                </Button>

                {tab === 'ADMIN_LOGIN' && (
                  <button
                    type="button"
                    onClick={() => { setTab('LOGIN'); setErrorMsg(''); }}
                    className="w-full text-center text-xs text-slate-400 hover:text-white pt-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Return to Student / Teacher Sign In
                  </button>
                )}
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Pre-Approved College Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. student@act.edu"
                    className="w-full px-3 py-2 bg-slate-950/90 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Must be pre-approved by the Admin.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full px-3 py-2 bg-slate-950/90 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 bg-slate-950/90 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Department *
                    </label>
                    <select
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-950/90 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Computer Science & Engineering">Computer Science</option>
                      <option value="Information Technology">Information Tech</option>
                      <option value="Electronics & Communication">Electronics & Comm</option>
                      <option value="Mechanical Engineering">Mechanical Eng</option>
                      <option value="Data Science & AI">Data Science & AI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Academic Year
                    </label>
                    <select
                      value={regYear}
                      onChange={(e) => setRegYear(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-950/90 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={regSkills}
                    onChange={(e) => setRegSkills(e.target.value)}
                    placeholder="e.g. React, Python, PostgreSQL, Docker"
                    className="w-full px-3 py-2 bg-slate-950/90 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">GitHub URL</label>
                    <input
                      type="url"
                      value={regGithub}
                      onChange={(e) => setRegGithub(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full px-2.5 py-1.5 bg-slate-950/90 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={regLinkedin}
                      onChange={(e) => setRegLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-2.5 py-1.5 bg-slate-950/90 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full py-2.5 text-xs font-semibold mt-2 shadow-lg shadow-indigo-600/20"
                  variant="primary"
                >
                  Create Account
                </Button>
              </form>
            )}

            {/* Secondary Admin Portal Link in Footer */}
            {tab !== 'ADMIN_LOGIN' && (
              <div className="pt-4 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => { setTab('ADMIN_LOGIN'); setErrorMsg(''); }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-800/60 font-medium cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Institutional Administrator Portal Login</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
