import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import {
  Sparkles,
  User,
  GraduationCap,
  Code2,
  Wrench,
  FolderGit2,
  Briefcase,
  Award,
  Trophy,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Plus,
  X,
  Edit3,
} from 'lucide-react';

export default function ResumeSummary({ data: initialData, filename, onReset }) {
  const navigate = useNavigate();
  const { setResumeData, config } = useInterview();

  const [data, setData] = useState({
    candidate_name: initialData.candidate_name || '',
    candidate_background: initialData.candidate_background || '',
    summary: initialData.summary || '',
    education: initialData.education || [],
    technical_skills: initialData.technical_skills || [],
    programming_languages: initialData.programming_languages || [],
    projects: initialData.projects || [],
    internships: initialData.internships || [],
    work_experience: initialData.work_experience || [],
    certifications: initialData.certifications || [],
    achievements: initialData.achievements || [],
  });

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !data.technical_skills.includes(newSkill.trim())) {
      setData((prev) => ({
        ...prev,
        technical_skills: [...prev.technical_skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setData((prev) => ({
      ...prev,
      technical_skills: prev.technical_skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleAddLanguage = (e) => {
    e.preventDefault();
    if (newLanguage.trim() && !data.programming_languages.includes(newLanguage.trim())) {
      setData((prev) => ({
        ...prev,
        programming_languages: [...prev.programming_languages, newLanguage.trim()],
      }));
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (langToRemove) => {
    setData((prev) => ({
      ...prev,
      programming_languages: prev.programming_languages.filter((l) => l !== langToRemove),
    }));
  };

  const handleConfirmAndProceed = () => {
    setResumeData(data);
    navigate('/interview');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-2xl border border-blue-200 dark:border-cyan-500/30 bg-blue-50/80 dark:bg-cyan-500/10 p-5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-cyan-500/20 text-blue-800 dark:text-cyan-400 border border-blue-200 dark:border-cyan-500/40 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0b1220] dark:text-white">Extracted Resume Profile</h3>
              <p className="text-xs text-neutral-600 dark:text-cyan-300/80">
                Extracted from <span className="font-mono font-semibold text-[#0b1220] dark:text-white">{filename}</span>. Review and confirm details below before starting the interview.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-neutral-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-slate-600 hover:text-blue-900 dark:hover:text-white transition-colors self-start sm:self-auto cursor-pointer shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Upload Different File</span>
          </button>
        </div>
      </div>

      {/* Candidate Background & Summary */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-6 backdrop-blur-md space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0b1220] dark:text-white">
            <User className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
            <span>Candidate Overview {data.candidate_name ? `• ${data.candidate_name}` : ''}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingSummary(!isEditingSummary)}
            className="flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-cyan-400 hover:text-blue-900 dark:hover:text-cyan-300 cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{isEditingSummary ? 'Done Editing' : 'Edit Profile'}</span>
          </button>
        </div>

        {isEditingSummary ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Candidate Name (used by AI Interviewer to address you personally)
              </label>
              <input
                type="text"
                placeholder="e.g. Sagneek Sen"
                value={data.candidate_name || ''}
                onChange={(e) => setData((prev) => ({ ...prev, candidate_name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-[#0b1220] dark:text-slate-200 focus:border-blue-600 dark:focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Overview & Summary
              </label>
              <textarea
                rows={3}
                value={data.summary || data.candidate_background}
                onChange={(e) => setData((prev) => ({ ...prev, summary: e.target.value, candidate_background: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs text-[#0b1220] dark:text-slate-200 focus:border-blue-600 dark:focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-cyan-400 font-sans"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {data.candidate_name && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/30 text-xs font-semibold text-blue-900 dark:text-cyan-300">
                <span>Candidate:</span>
                <span className="font-bold">{data.candidate_name}</span>
              </div>
            )}
            <p className="text-xs text-neutral-600 dark:text-slate-300 leading-relaxed bg-blue-50/40 dark:bg-slate-950/40 p-4 rounded-xl border border-blue-100 dark:border-slate-800/80">
              {data.summary || data.candidate_background || 'No overview summary generated.'}
            </p>
          </div>
        )}
      </div>

      {/* Programming Languages & Technical Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Programming Languages */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-6 backdrop-blur-md space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-bold text-[#0b1220] dark:text-white">
              <Code2 className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
              <span>Programming Languages</span>
            </label>
            <span className="text-xs text-neutral-500 dark:text-slate-400">{data.programming_languages.length} identified</span>
          </div>

          <div className="flex flex-wrap gap-2 min-h-[48px]">
            {data.programming_languages.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-300"
              >
                <span>{lang}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(lang)}
                  className="rounded-full p-0.5 hover:bg-indigo-200/50 dark:hover:bg-indigo-500/20 text-indigo-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddLanguage} className="flex gap-2">
            <input
              type="text"
              placeholder="Add language (e.g. Go, Rust)..."
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-[#0b1220] dark:text-slate-200 placeholder-neutral-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Technical Skills */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-6 backdrop-blur-md space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-bold text-[#0b1220] dark:text-white">
              <Wrench className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
              <span>Frameworks & Tools</span>
            </label>
            <span className="text-xs text-neutral-500 dark:text-slate-400">{data.technical_skills.length} identified</span>
          </div>

          <div className="flex flex-wrap gap-2 min-h-[48px]">
            {data.technical_skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-cyan-500/30 bg-blue-50 dark:bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-blue-900 dark:text-cyan-300"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="rounded-full p-0.5 hover:bg-blue-200/50 dark:hover:bg-cyan-500/20 text-blue-600 dark:text-cyan-400 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddSkill} className="flex gap-2">
            <input
              type="text"
              placeholder="Add skill (e.g. Kafka, Docker)..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-[#0b1220] dark:text-slate-200 placeholder-neutral-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>
      </div>

      {/* Projects */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-6 backdrop-blur-md space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0b1220] dark:text-white">
            <FolderGit2 className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
            <span>Extracted Projects</span>
          </div>
          <span className="text-xs text-neutral-500 dark:text-slate-400">{data.projects.length} projects</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.projects.length > 0 ? (
            data.projects.map((proj, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 p-4 space-y-2"
              >
                <h4 className="text-sm font-bold text-[#0b1220] dark:text-white">{proj.title}</h4>
                {proj.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {proj.technologies.slice(0, 4).map((tech, tIdx) => (
                      <span
                        key={tIdx}
                        className="rounded-md bg-blue-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-blue-800 dark:text-slate-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {proj.description && (
                  <p className="text-xs text-neutral-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {proj.description}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-400 dark:text-slate-500 italic">No project entries extracted from resume.</p>
          )}
        </div>
      </div>

      {/* Work Experience */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-6 backdrop-blur-md space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0b1220] dark:text-white">
            <Briefcase className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
            <span>Work Experience & Internships</span>
          </div>
          <span className="text-xs text-neutral-500 dark:text-slate-400">
            {data.work_experience.length + data.internships.length} roles
          </span>
        </div>

        <div className="space-y-3">
          {[...data.work_experience, ...data.internships].length > 0 ? (
            [...data.work_experience, ...data.internships].map((exp, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#0b1220] dark:text-white">{exp.role}</h4>
                  {exp.duration && (
                    <span className="text-[11px] font-mono text-neutral-500 dark:text-slate-400">{exp.duration}</span>
                  )}
                </div>
                {exp.company && (
                  <p className="text-xs font-semibold text-blue-800 dark:text-sky-400">{exp.company}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-400 dark:text-slate-500 italic">No formal employment entries extracted.</p>
          )}
        </div>
      </div>

      {/* Target Alignment Summary Bar */}
      <div className="rounded-2xl border border-blue-200 dark:border-slate-800 bg-blue-50/60 dark:bg-slate-950/80 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-cyan-400">
            Interview Target
          </span>
          <p className="text-sm font-bold text-[#0b1220] dark:text-white mt-0.5">
            {config?.finalCompany || 'Google'} • {config?.finalRole || 'Software Engineer'} ({config?.difficulty || 'Intermediate'})
          </p>
        </div>

        <button
          type="button"
          onClick={handleConfirmAndProceed}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#0b1220] hover:bg-blue-900 text-white dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 px-8 py-4 text-sm font-bold shadow-xl shadow-blue-950/10 dark:shadow-cyan-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Confirm & Start AI Interview</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
