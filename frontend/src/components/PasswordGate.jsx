import { useState } from 'react';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Bot,
  ExternalLink,
  Sun,
  Moon,
  Cloud,
} from 'lucide-react';
import { useInterview } from '../context/InterviewContext';

export default function PasswordGate({ children }) {
  const { isAuthenticated, authenticate, theme, toggleTheme } = useInterview();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = theme === 'nitya-dark';

  if (isAuthenticated) {
    return children;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Please enter the access password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    setTimeout(() => {
      const success = authenticate(password.trim());
      if (!success) {
        setErrorMessage('Incorrect password. Please verify and try again.');
        setIsSubmitting(false);
      }
    }, 250);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center overflow-hidden bg-[#f5f9ff] dark:bg-[#07111f] text-[#0b1220] dark:text-slate-100 transition-colors duration-300 font-sans p-4 sm:p-6">
      {/* Background Soft Mesh Glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-400/20 dark:bg-cyan-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-400/20 dark:bg-blue-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-indigo-500/10 dark:bg-blue-500/5 blur-[120px]" />

      {/* Top Bar: Brand & Theme Toggle */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-700 text-white shadow-md shadow-blue-600/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-[#0b1220] dark:text-white">
                AI Interview Coach
              </span>
              <span className="rounded-full bg-blue-50 dark:bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-900 dark:text-cyan-300 border border-blue-200/60 dark:border-blue-500/30">
                Nitya UI
              </span>
            </div>
            <p className="text-[11px] font-medium text-neutral-500 dark:text-slate-400 hidden sm:block">
              Dream • Achieve • Succeed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Back to Home Link in Header */}
          <a
            href="https://www.nityacloudtech.com/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-[#0b1220]/80 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-slate-300 hover:text-blue-900 dark:hover:text-white transition shadow-sm"
          >
            <span>Home</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0b1220]/80 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-slate-700 transition cursor-pointer shadow-sm"
            title="Toggle Theme Palette"
          >
            {isDark ? (
              <Moon className="h-3.5 w-3.5 text-cyan-400" />
            ) : (
              <Cloud className="h-3.5 w-3.5 text-blue-700" />
            )}
            <span className="hidden sm:inline text-[11px] font-semibold">
              {isDark ? 'Midnight' : 'Cloud'}
            </span>
          </button>
        </div>
      </header>

      {/* Center Authentication Card */}
      <div className="w-full max-w-md my-auto z-10 animate-fadeIn">
        <div className="relative rounded-3xl border border-white/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0b1220]/85 p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all">
          
          {/* Icon Header */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/15 via-blue-600/15 to-indigo-600/15 border border-blue-200 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-400 shadow-inner mb-5">
            <Lock className="h-8 w-8" />
          </div>

          <div className="text-center space-y-1.5 mb-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-cyan-500/10 px-3 py-1 text-[11px] font-bold text-blue-900 dark:text-cyan-300 border border-blue-200/80 dark:border-cyan-500/20 mb-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Protected Portal Access</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0b1220] dark:text-white tracking-tight">
              Enter Platform Password
            </h1>
            <p className="text-xs text-neutral-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Please enter your authorized Nitya Cloudtech access code to unlock the AI Interview Coach.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-slate-400 mb-1.5">
                Access Password
              </label>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-3 text-neutral-400 dark:text-slate-500">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Enter password..."
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#07111f]/80 pl-9 pr-10 py-2.5 text-xs font-mono text-[#0b1220] dark:text-white placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-cyan-500 transition shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3 text-neutral-400 hover:text-neutral-700 dark:text-slate-500 dark:hover:text-slate-300 transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-2.5 text-xs text-rose-700 dark:text-rose-400 animate-fadeIn">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-bold py-3 px-4 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Verifying...' : 'Unlock Platform'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Back to Home Redirect Link */}
          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <a
              href="https://www.nityacloudtech.com/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 dark:text-cyan-400 dark:hover:text-cyan-300 transition group"
            >
              <span>← Back to Home (nityacloudtech.com)</span>
              <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-5xl text-center py-2 z-10 text-[11px] text-neutral-400 dark:text-slate-500">
        <p>© 2026 Nitya Cloudtech Private Limited. All rights reserved.</p>
      </footer>
    </div>
  );
}
