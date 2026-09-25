import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useApp } from '../context/AppContext';

export const ForgotPasswordPage: React.FC = () => {
  const { brandingConfig } = useApp();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-6 selection:bg-[#0B1E36] selection:text-white font-sans-ui">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded shadow-sm p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded bg-white p-1 flex items-center justify-center mx-auto mb-3 shadow-2xs border border-slate-200">
            <img src="/agni-logo.png" alt="AGNI Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-serif-academic text-xl sm:text-2xl font-bold text-[#0B1E36] tracking-tight">
            Reset Institutional Password
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter your authorized college email address to receive password reset instructions.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-900">Reset Instructions Dispatched</h3>
            <p className="text-xs text-slate-700">
              We sent password recovery instructions to <span className="font-semibold text-slate-900">{email}</span>.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#0B1E36] hover:underline pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                College Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@act.edu"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B1E36]"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full py-2.5 text-xs font-semibold bg-[#0B1E36] hover:bg-[#132c4e] text-white"
              variant="primary"
            >
              Send Reset Instructions
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0B1E36] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
