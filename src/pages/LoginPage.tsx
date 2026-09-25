import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
              setTab(tab === 'ADMIN_LOGIN' ? 'LOGIN' : 'ADMIN_LOGIN');
              setErrorMsg('');
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold transition-all cursor-pointer ${
              tab === 'ADMIN_LOGIN'
                ? 'bg-[#0B1E36] text-white border-[#0B1E36] shadow-2xs'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
            }`}
            title="Institutional Admin Portal"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${tab === 'ADMIN_LOGIN' ? 'text-white' : 'text-[#0B1E36]'}`} />
            <span>Admin Portal</span>
          </button>
        </div>
      </header>

      {/* Main Clean Institutional Authentication UI */}
      <main className="w-full flex-1 flex flex-col justify-center items-center p-6 my-8">
        <div className="w-full max-w-md">
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
              {tab === 'ADMIN_LOGIN' ? 'Administrator Authentication' : 'Official Academic Portal'}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">
              {brandingConfig.collegeName}
            </p>
          </div>

          {/* Clean White Card */}
          <div className="bg-white border border-slate-200 rounded shadow-sm p-6 sm:p-8 space-y-5">
            {/* Standard Tabs or Admin Authority Notice */}
            {tab !== 'ADMIN_LOGIN' ? (
              <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200 rounded text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setTab('LOGIN'); setErrorMsg(''); }}
                  className={`py-1.5 rounded transition-all cursor-pointer ${
                    tab === 'LOGIN' ? 'bg-[#0B1E36] text-white shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('REGISTER'); setErrorMsg(''); }}
                  className={`py-1.5 rounded transition-all cursor-pointer ${
                    tab === 'REGISTER' ? 'bg-[#0B1E36] text-white shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-[#0B1E36] shrink-0" />
                  <span>Administrator Access Portal</span>
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

            {/* Sign In Form */}
            {tab === 'LOGIN' || tab === 'ADMIN_LOGIN' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tab === 'ADMIN_LOGIN' ? 'Administrator Email Address' : 'Official College Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={tab === 'ADMIN_LOGIN' ? 'admin@act.edu' : 'yourname@act.edu'}
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
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1E36] focus:border-[#0B1E36]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full py-2.5 text-xs font-semibold shadow-2xs bg-[#0B1E36] hover:bg-[#132c4e] text-white"
                  variant="primary"
                >
                  {tab === 'ADMIN_LOGIN' ? 'Sign In to Admin Dashboard' : 'Sign In to Institutional Portal'}
                </Button>

                {tab === 'ADMIN_LOGIN' && (
                  <button
                    type="button"
                    onClick={() => { setTab('LOGIN'); setErrorMsg(''); }}
                    className="w-full text-center text-xs text-slate-500 hover:text-[#0B1E36] pt-1 flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Return to Student / Teacher Sign In
                  </button>
                )}
              </form>
            ) : (
              /* Registration Form */
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pre-Approved College Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. student@act.edu"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1E36] focus:border-[#0B1E36]"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Must be pre-authorized by College Administration.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1E36] focus:border-[#0B1E36]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1E36] focus:border-[#0B1E36]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department *
                    </label>
                    <select
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0B1E36] focus:border-[#0B1E36]"
                    >
                      <option value="Computer Science & Engineering">Computer Science</option>
                      <option value="Information Technology">Information Tech</option>
                      <option value="Electronics & Communication">Electronics & Comm</option>
                      <option value="Mechanical Engineering">Mechanical Eng</option>
                      <option value="Data Science & AI">Data Science & AI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Academic Year
                    </label>
                    <select
                      value={regYear}
                      onChange={(e) => setRegYear(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0B1E36] focus:border-[#0B1E36]"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={regSkills}
                    onChange={(e) => setRegSkills(e.target.value)}
                    placeholder="e.g. React, Python, PostgreSQL, Docker"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1E36] focus:border-[#0B1E36]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub URL</label>
                    <input
                      type="url"
                      value={regGithub}
                      onChange={(e) => setRegGithub(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1E36] focus:border-[#0B1E36]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={regLinkedin}
                      onChange={(e) => setRegLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1E36] focus:border-[#0B1E36]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full py-2.5 text-xs font-semibold mt-2 shadow-2xs bg-[#0B1E36] hover:bg-[#132c4e] text-white"
                  variant="primary"
                >
                  Create Account
                </Button>
              </form>
            )}

            {/* Secondary Admin Portal Link in Footer */}
            {tab !== 'ADMIN_LOGIN' && (
              <div className="pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => { setTab('ADMIN_LOGIN'); setErrorMsg(''); }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0B1E36] transition-colors py-1 px-2 rounded hover:bg-slate-50 font-medium cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0B1E36]" />
                  <span>Institutional Administrator Portal Login</span>
                </button>
              </div>
            )}
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
