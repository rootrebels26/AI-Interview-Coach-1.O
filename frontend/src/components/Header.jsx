import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  HelpCircle,
  ArrowRight,
  X,
  CheckCircle2,
  Sun,
  Moon,
  Cloud,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { useInterview } from '../context/InterviewContext';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, lockApp } = useInterview();
  const [showAbout, setShowAbout] = useState(false);

  // The /interview route is a dedicated full-screen virtual video conference studio
  if (location.pathname === '/interview') {
    return null;
  }

  const isDark = theme === 'nitya-dark';

  return (
    <>
      <header className="sticky top-0 z-50 px-4 py-3 bg-[#f5f9ff]/80 dark:bg-[#07111f]/80 backdrop-blur-md transition-colors duration-300">
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/80 dark:border-white/10 bg-white/75 dark:bg-[#0b1220]/75 px-4 sm:px-6 py-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all">
          {/* Logo with Nitya CloudTech Aesthetics */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-700 text-white shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform duration-200">
              <Bot className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-[-0.02em] text-[#0b1220] dark:text-white">
                  AI Interview Coach
                </span>
                <span className="rounded-full bg-blue-50 dark:bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-900 dark:text-cyan-300 border border-blue-200/60 dark:border-blue-500/30">
                  Nitya UI
                </span>
              </div>
              <p className="hidden text-xs font-medium text-neutral-500 dark:text-slate-400 sm:block">
                Dream • Achieve • Succeed
              </p>
            </div>
          </Link>

          {/* Navigation Links & Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="https://www.nityacloudtech.com/"
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-neutral-600 dark:text-slate-300 hover:text-blue-900 dark:hover:text-white transition flex items-center gap-1"
            >
              <span>Home</span>
            </a>

            <button
              type="button"
              onClick={() => setShowAbout(true)}
              className="hidden sm:flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-neutral-600 dark:text-slate-300 hover:text-blue-900 dark:hover:text-white transition cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
              <span>About</span>
            </button>

            {/* Nitya CloudTech Theme Palette Toggle Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-slate-700 transition cursor-pointer shadow-sm"
              title="Toggle Nitya CloudTech Color Palette"
            >
              {isDark ? (
                <>
                  <Moon className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="hidden md:inline text-[11px] font-semibold">Midnight Mode</span>
                </>
              ) : (
                <>
                  <Cloud className="h-3.5 w-3.5 text-blue-700" />
                  <span className="hidden md:inline text-[11px] font-semibold">Cloud Mode</span>
                </>
              )}
            </button>

            {/* Lock Session Button */}
            <button
              type="button"
              onClick={lockApp}
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800 transition cursor-pointer shadow-sm"
              title="Lock Platform (Password required to re-enter)"
            >
              <Lock className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold">Lock</span>
            </button>

            {location.pathname !== '/setup' && (
              <button
                type="button"
                onClick={() => navigate('/setup')}
                className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-[#0b1220] dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-900 cursor-pointer"
              >
                <span>Start Interview</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1220] p-6 shadow-2xl transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
                <h3 className="text-base font-bold text-[#0b1220] dark:text-white">
                  About AI Interview Coach
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAbout(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs sm:text-sm text-neutral-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong className="text-[#0b1220] dark:text-white">AI Interview Coach</strong> is an intelligent, standalone interview preparation platform with the signature{' '}
                <span className="font-semibold text-blue-900 dark:text-cyan-400">
                  Nitya CloudTech
                </span>{' '}
                design ecosystem.
              </p>
              <div className="rounded-xl border border-blue-100 dark:border-blue-950 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 dark:text-blue-300 font-semibold text-xs">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                  <span>No login, no database, 100% free-tier AI powered.</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                  Upload your resume, customize your target company and role, and practice with real-world scraped questions.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAbout(false)}
                className="rounded-xl bg-[#0b1220] dark:bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
