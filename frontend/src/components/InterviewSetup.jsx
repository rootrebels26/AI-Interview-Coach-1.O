import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import {
  Building2,
  Briefcase,
  Layers,
  Gauge,
  FileCode,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const COMPANIES = [
  'Google',
  'Microsoft',
  'Amazon',
  'Meta',
  'Apple',
  'NVIDIA',
  'OpenAI',
  'Accenture',
  'Deloitte',
  'TCS',
  'Infosys',
  'Wipro',
  'PayPal',
  'Other',
];

const JOB_ROLES = [
  'Software Engineer',
  'Data Engineer',
  'Fabric Engineer',
  'Python Developer',
  'Java Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
  'AI Engineer',
  'Generative AI Engineer',
  'Cloud Solutions Architect',
  'Computer Vision Engineer',
  'DevOps Engineer',
  'Other',
];

const INTERVIEW_TYPES = [
  {
    id: 'Technical Interview',
    name: 'Technical Interview',
    description: 'Technical fundamentals, architecture, and practical engineering.',
  },
  {
    id: 'HR Interview',
    name: 'HR Interview',
    description: 'Culture fit, career motivation, teamwork, and communication.',
  },
  {
    id: 'Behavioural Interview',
    name: 'Behavioural Interview',
    description: 'STAR framework, situational decision making, and leadership.',
  },
  {
    id: 'Coding Interview',
    name: 'Coding Interview',
    description: 'Data structures, algorithms, problem solving, and optimization.',
  },
  {
    id: 'Mixed Interview',
    name: 'Mixed Interview',
    description: 'Combined technical, coding, and behavioral assessment.',
  },
];

const DIFFICULTY_LEVELS = [
  { id: 'Beginner', name: 'Beginner', desc: 'Core fundamentals, junior concepts, syntax' },
  { id: 'Intermediate', name: 'Intermediate', desc: 'Standard production systems & design' },
  { id: 'Advanced', name: 'Advanced', desc: 'Complex trade-offs, architecture & scale' },
  { id: 'Expert', name: 'Expert', desc: 'Principal/Staff level systems & leadership' },
];

const DURATION_OPTIONS = [
  { id: 1, label: '1 Min', title: '1 Minute', desc: '⚡ Quick Demo & Voice Test' },
  { id: 5, label: '5 Min', title: '5 Minutes', desc: '⏱️ Express Mock Session' },
  { id: 10, label: '10 Min', title: '10 Minutes', desc: '🎯 Standard Technical Round' },
  { id: 20, label: '20 Min', title: '20 Minutes', desc: '🔍 Deep Dive Architecture' },
  { id: 30, label: '30 Min', title: '30 Minutes', desc: '🏆 Full Comprehensive (Max)' },
];

export default function InterviewSetup() {
  const navigate = useNavigate();
  const { config, setConfig } = useInterview();

  const [company, setCompany] = useState(config?.company || 'Google');
  const [customCompany, setCustomCompany] = useState(config?.customCompany || '');
  const [role, setRole] = useState(config?.role || 'Software Engineer');
  const [customRole, setCustomRole] = useState(config?.customRole || '');
  const [interviewType, setInterviewType] = useState(config?.interviewType || 'Technical Interview');
  const [difficulty, setDifficulty] = useState(config?.difficulty || 'Intermediate');
  const [durationMinutes, setDurationMinutes] = useState(config?.durationMinutes || 10);
  const [jobDescription, setJobDescription] = useState(config?.jobDescription || '');

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!company) {
      newErrors.company = 'Please select a company';
    } else if (company === 'Other' && !customCompany.trim()) {
      newErrors.customCompany = 'Please enter your custom company name';
    }

    if (!role) {
      newErrors.role = 'Please select a job role';
    } else if (role === 'Other' && !customRole.trim()) {
      newErrors.customRole = 'Please enter your custom job role';
    }

    if (!interviewType) {
      newErrors.interviewType = 'Please select an interview type';
    }

    if (!difficulty) {
      newErrors.difficulty = 'Please select a difficulty level';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const finalCompany = company === 'Other' ? customCompany.trim() : company;
    const finalRole = role === 'Other' ? customRole.trim() : role;

    setConfig({
      company,
      customCompany: company === 'Other' ? customCompany.trim() : '',
      finalCompany,
      role,
      customRole: role === 'Other' ? customRole.trim() : '',
      finalRole,
      interviewType,
      difficulty,
      durationMinutes: Number(durationMinutes) || 10,
      jobDescription: jobDescription.trim(),
    });

    navigate('/resume');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Step Indicator */}
      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-cyan-400">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-cyan-500/20 border border-blue-300 dark:border-cyan-500/40 text-blue-900 dark:text-cyan-300 font-bold">
          1
        </span>
        <span>Interview Configuration</span>
      </div>

      {/* A. Company Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-bold text-[#0b1220] dark:text-white">
            <Building2 className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
            <span>Target Company</span>
            <span className="text-rose-500">*</span>
          </label>
          <span className="text-xs text-neutral-500 dark:text-slate-400">Select target employer</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {COMPANIES.map((comp) => {
            const isSelected = company === comp;
            return (
              <button
                type="button"
                key={comp}
                onClick={() => {
                  setCompany(comp);
                  if (errors.company) setErrors((prev) => ({ ...prev, company: null }));
                }}
                className={`flex items-center justify-center rounded-xl p-3 text-xs sm:text-sm font-semibold transition-all border text-center cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm dark:bg-cyan-500/15 dark:border-cyan-400 dark:text-cyan-300 dark:shadow-cyan-500/20'
                    : 'bg-white/80 border-slate-200 text-neutral-700 hover:border-blue-300 hover:text-blue-900 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white'
                }`}
              >
                <span>{comp}</span>
              </button>
            );
          })}
        </div>

        {company === 'Other' && (
          <div className="pt-2 animate-fadeIn">
            <input
              type="text"
              placeholder="Type your company name (e.g. Netflix, Stripe, Start-up)..."
              value={customCompany}
              onChange={(e) => {
                setCustomCompany(e.target.value);
                if (errors.customCompany) setErrors((prev) => ({ ...prev, customCompany: null }));
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 px-4 py-3 text-sm text-[#0b1220] dark:text-white placeholder-neutral-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-cyan-400"
            />
            {errors.customCompany && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-500">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{errors.customCompany}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* B. Job Role Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-bold text-[#0b1220] dark:text-white">
            <Briefcase className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
            <span>Target Job Role</span>
            <span className="text-rose-500">*</span>
          </label>
          <span className="text-xs text-neutral-500 dark:text-slate-400">Select target position</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {JOB_ROLES.map((r) => {
            const isSelected = role === r;
            return (
              <button
                type="button"
                key={r}
                onClick={() => {
                  setRole(r);
                  if (errors.role) setErrors((prev) => ({ ...prev, role: null }));
                }}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs sm:text-sm font-medium transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm dark:bg-cyan-500/15 dark:border-cyan-400 dark:text-cyan-300 dark:shadow-cyan-500/20'
                    : 'bg-white/80 border-slate-200 text-neutral-700 hover:border-blue-300 hover:text-blue-900 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white'
                }`}
              >
                <span className="truncate">{r}</span>
                {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-cyan-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>

        {role === 'Other' && (
          <div className="pt-2 animate-fadeIn">
            <input
              type="text"
              placeholder="Type your target role (e.g. Solutions Architect, QA Lead)..."
              value={customRole}
              onChange={(e) => {
                setCustomRole(e.target.value);
                if (errors.customRole) setErrors((prev) => ({ ...prev, customRole: null }));
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 px-4 py-3 text-sm text-[#0b1220] dark:text-white placeholder-neutral-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-cyan-400"
            />
            {errors.customRole && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-500">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{errors.customRole}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* C. Interview Type */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-bold text-[#0b1220] dark:text-white">
            <Layers className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
            <span>Interview Type</span>
            <span className="text-rose-500">*</span>
          </label>
          <span className="text-xs text-neutral-500 dark:text-slate-400">Interview format</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {INTERVIEW_TYPES.map((t) => {
            const isSelected = interviewType === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setInterviewType(t.id)}
                className={`rounded-2xl p-4 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-600 text-[#0b1220] shadow-sm dark:bg-cyan-500/15 dark:border-cyan-400 dark:text-white dark:shadow-cyan-500/20'
                    : 'bg-white/70 border-slate-200 text-neutral-600 hover:border-blue-300 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-sm font-bold text-[#0b1220] dark:text-white">{t.name}</h4>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-cyan-400" />}
                </div>
                <p className="text-xs text-neutral-500 dark:text-slate-400 leading-relaxed">{t.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* D. Difficulty Level */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-bold text-[#0b1220] dark:text-white">
            <Gauge className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
            <span>Difficulty Level</span>
            <span className="text-rose-500">*</span>
          </label>
          <span className="text-xs text-neutral-500 dark:text-slate-400">Calibrate question rigor</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DIFFICULTY_LEVELS.map((diff) => {
            const isSelected = difficulty === diff.id;
            return (
              <div
                key={diff.id}
                onClick={() => setDifficulty(diff.id)}
                className={`rounded-2xl p-4 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-600 text-[#0b1220] shadow-sm dark:bg-indigo-500/15 dark:border-indigo-400 dark:text-white dark:shadow-indigo-500/20'
                    : 'bg-white/70 border-slate-200 text-neutral-600 hover:border-blue-300 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-sm font-bold text-[#0b1220] dark:text-white">{diff.name}</h4>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-indigo-400" />}
                </div>
                <p className="text-xs text-neutral-500 dark:text-slate-400 leading-relaxed">{diff.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* E. Interview Duration Setting (User Requested: 1m, 5m, 10m, 20m, 30m max) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-bold text-[#0b1220] dark:text-white">
            <Clock className="h-4 w-4 text-blue-600 dark:text-amber-400" />
            <span>Interview Duration</span>
            <span className="text-rose-500">*</span>
          </label>
          <span className="text-xs text-neutral-500 dark:text-slate-400">1 to 30 min (Max 30 min)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {DURATION_OPTIONS.map((opt) => {
            const isSelected = durationMinutes === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setDurationMinutes(opt.id)}
                className={`rounded-2xl p-3.5 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 text-[#0b1220] dark:text-white shadow-sm ring-1 ring-amber-500'
                    : 'bg-white/70 border-slate-200 text-neutral-600 hover:border-amber-300 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base font-extrabold text-[#0b1220] dark:text-white">{opt.label}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-slate-400 leading-tight">{opt.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* E. Optional Job Description */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-bold text-[#0b1220] dark:text-white">
            <FileCode className="h-4 w-4 text-blue-600 dark:text-slate-400" />
            <span>Job Description</span>
            <span className="rounded-full bg-blue-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:text-slate-400 border border-blue-100 dark:border-transparent">
              Optional
            </span>
          </label>
          <span className="text-xs text-neutral-500 dark:text-slate-400">Improves question relevance</span>
        </div>

        <p className="text-xs text-neutral-500 dark:text-slate-400">
          Paste the job posting description or specific role requirements to generate hyper-relevant interview questions.
        </p>

        <textarea
          rows={4}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste requirements, responsibilities, or tech stack details here..."
          className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 text-xs sm:text-sm text-[#0b1220] dark:text-slate-200 placeholder-neutral-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-cyan-400 transition-all font-mono"
        />
      </div>

      {/* Primary Action Button */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-neutral-500 dark:text-slate-400">
          Step 1 of 4 • Target parameters ready for resume extraction
        </p>
        <button
          type="submit"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-[#0b1220] hover:bg-blue-900 text-white dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 px-8 py-4 text-sm font-bold shadow-lg shadow-blue-950/10 dark:shadow-cyan-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          <span>Continue to Resume Upload</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
