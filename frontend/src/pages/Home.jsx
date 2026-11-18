import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  FileText,
  Mic,
  Award,
  Sparkles,
  Shield,
  Cpu,
  ChevronRight,
  Cloud,
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const steps = [
    {
      step: '01',
      title: 'Target Company & Role',
      desc: 'Choose from top tech companies or specify a custom role and difficulty level.',
      icon: Building2,
      accent: 'from-blue-500/10 to-cyan-500/10 text-blue-700 dark:text-cyan-400 border-blue-200 dark:border-cyan-500/30',
    },
    {
      step: '02',
      title: 'Upload Your Resume',
      desc: 'Submit your PDF or DOCX resume to extract your skills, projects, and work history.',
      icon: FileText,
      accent: 'from-indigo-500/10 to-blue-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30',
    },
    {
      step: '03',
      title: 'Practise with AI Interviewer',
      desc: 'Answer realistic voice or text questions adapted to your unique experience.',
      icon: Mic,
      accent: 'from-cyan-500/10 to-teal-500/10 text-cyan-700 dark:text-teal-400 border-cyan-200 dark:border-teal-500/30',
    },
    {
      step: '04',
      title: 'Get Detailed Feedback',
      desc: 'Receive question-by-question scoring and actionable improvement roadmaps after 6 questions.',
      icon: Award,
      accent: 'from-emerald-500/10 to-teal-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-between overflow-hidden">
      {/* Background Soft Cloud/Cyan Meshes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-cyan-400/15 via-blue-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Main Hero Section */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 text-center">
        {/* Nitya CloudTech Inspired Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 dark:border-cyan-500/30 bg-white/80 dark:bg-[#0b1220]/80 px-4 py-1.5 text-xs font-semibold text-blue-900 dark:text-cyan-300 shadow-sm backdrop-blur-md mb-8 animate-fadeIn">
          <Cloud className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
          <span>Nitya CloudTech UI Theme</span>
          <span className="text-slate-400 dark:text-slate-600">•</span>
          <span className="text-neutral-600 dark:text-slate-400 font-normal">Dream • Achieve • Succeed</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-[-0.03em] text-[#0b1220] dark:text-white leading-[1.1]">
          Your Personal <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-900 via-blue-600 to-cyan-500 dark:from-cyan-400 dark:via-sky-300 dark:to-blue-500 bg-clip-text text-transparent">
            AI Interviewer
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-xl text-neutral-600 dark:text-slate-300 font-normal leading-relaxed">
          Prepare for your dream job with realistic AI-powered mock interviews tailored to your resume, skills and career goals.
        </p>

        {/* Primary CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/setup')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-[#0b1220] hover:bg-blue-900 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-950/15 dark:shadow-cyan-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            <span>Start Interview</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Privacy guarantees badge */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>100% Free & Standalone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Interactive Voice & Speech</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Min 6 Questions for Full Report</span>
          </div>
        </div>
      </div>

      {/* Process / Steps Section */}
      <div className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-[#07111f]/60 py-16 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-800 dark:text-cyan-400">
              Simple 4-Step Process
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0b1220] dark:text-white tracking-tight">
              How the AI Interview Works
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="relative rounded-2xl border border-white/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0b1220]/70 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl hover:border-blue-300 dark:hover:border-slate-700 hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-neutral-400 dark:text-slate-500 group-hover:text-blue-900 dark:group-hover:text-cyan-400 transition-colors">
                      {item.step}
                    </span>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border bg-gradient-to-tr ${item.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-[#0b1220] dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Quick action link */}
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => navigate('/setup')}
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-900 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 transition-colors cursor-pointer group"
            >
              <span>Begin your interview session</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer info with Nitya signature */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-neutral-500 dark:text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 AI Interview Coach. Standalone AI-powered mock interview practice platform.</p>
          <p className="font-medium text-neutral-400 dark:text-slate-500">Nitya CloudTech UI Theme • Dream • Achieve • Succeed</p>
        </div>
      </footer>
    </div>
  );
}
