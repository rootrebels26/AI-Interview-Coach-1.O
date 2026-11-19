import { useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Printer,
  RotateCcw,
  Home,
  ChevronDown,
  ChevronUp,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Download,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Target,
  Cloud,
} from 'lucide-react';

export default function InterviewReport({ report, onRestart, onHome }) {
  const [expandedQuestions, setExpandedQuestions] = useState({ 1: true });

  const toggleQuestion = (qNum) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qNum]: !prev[qNum],
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const {
    company,
    role,
    difficulty,
    interview_type,
    generated_at,
    overall_scores,
    question_reviews = [],
    overall_analysis,
    final_recommendation,
  } = report;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10';
    if (score >= 65) return 'text-blue-700 dark:text-cyan-400 border-blue-200 dark:border-cyan-500/30 bg-blue-50 dark:bg-cyan-500/10';
    if (score >= 50) return 'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10';
    return 'text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10';
  };

  return (
    <div className="space-y-10 animate-fadeIn print:text-black print:bg-white">
      {/* Top Action Bar (Hidden during print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-6 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-cyan-400">
            <Cloud className="h-3.5 w-3.5" />
            <span>Interview Performance Analysis • Nitya UI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1220] dark:text-white mt-1">
            Candidate Feedback Report
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-neutral-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
          >
            <Printer className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-neutral-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0b1220] hover:bg-blue-900 text-white dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 px-4 py-2 text-xs font-bold shadow-md shadow-blue-950/10 dark:shadow-cyan-500/20 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Practise Again</span>
          </button>

          <a
            href="https://www.nityacloudtech.com/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-slate-400 hover:text-blue-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </a>
        </div>
      </div>

      {/* Main Report Header Card */}
      <div className="rounded-3xl border border-white/80 dark:border-slate-800 bg-white/85 dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-950 p-6 sm:p-8 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:shadow-2xl space-y-6 print:border-gray-300 print:bg-white print:text-black">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800/80 print:border-gray-200">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="rounded-full bg-blue-50 dark:bg-cyan-500/10 px-3 py-1 text-xs font-bold text-blue-900 dark:text-cyan-400 border border-blue-200 dark:border-cyan-500/20 print:border-gray-300 print:text-black">
                {company}
              </span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-neutral-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 print:border-gray-300 print:text-black">
                {role}
              </span>
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-900 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 print:border-gray-300 print:text-black">
                {difficulty} Level
              </span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-neutral-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 print:border-gray-300 print:text-black">
                {interview_type}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-slate-400 flex items-center gap-1.5 print:text-gray-600">
              <Calendar className="h-3.5 w-3.5" />
              <span>Conducted: {generated_at}</span>
            </p>
          </div>

          {/* Overall Performance Badge */}
          <div className="flex items-center gap-4 bg-blue-50/80 dark:bg-slate-950/80 p-4 rounded-2xl border border-blue-200 dark:border-slate-800/80 print:border-gray-300 print:bg-gray-50">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-slate-400 print:text-gray-600">
                Overall Interview Score
              </span>
              <p className="text-3xl font-black text-[#0b1220] dark:text-white print:text-black">
                {overall_scores.overall_performance}
                <span className="text-sm font-semibold text-blue-700 dark:text-cyan-400">/100</span>
              </p>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 print:text-green-700 mt-0.5">
                {overall_analysis.interview_readiness_estimate}
              </p>
            </div>
          </div>
        </div>

        {/* 6 Aggregate Normalized Dimension Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Overall', val: overall_scores.overall_performance, weight: 'Total' },
            { label: 'Technical', val: overall_scores.technical_knowledge, weight: '25%' },
            { label: 'Communication', val: overall_scores.communication, weight: '15%' },
            { label: 'Problem Solving', val: overall_scores.problem_solving, weight: '15%' },
            { label: 'Practical Exp', val: overall_scores.practical_experience, weight: '15%' },
            { label: 'Structure', val: overall_scores.answer_structure, weight: '10%' },
          ].map((sc, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/50 p-3.5 text-center print:border-gray-300 print:bg-white"
            >
              <span className="text-[10px] font-semibold text-neutral-500 dark:text-slate-400 block">{sc.label}</span>
              <p className="text-xl font-bold text-[#0b1220] dark:text-white mt-1 print:text-black">{sc.val}%</p>
              <span className="text-[9px] text-blue-700 dark:text-cyan-400 font-mono block mt-0.5">{sc.weight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Analysis & Findings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strongest Answers & Demonstrated Strengths */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-sm space-y-4 print:border-gray-300 print:bg-white print:text-black">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Strongest Answers & Core Strengths</span>
          </div>
          <ul className="space-y-2.5 text-xs text-neutral-600 dark:text-slate-300 leading-relaxed print:text-black">
            {overall_analysis.strongest_answers?.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-0.5">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Technical Gaps & Repeated Mistakes */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-sm space-y-4 print:border-gray-300 print:bg-white print:text-black">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span>Technical Gaps & Improvement Areas</span>
          </div>
          <ul className="space-y-2.5 text-xs text-neutral-600 dark:text-slate-300 leading-relaxed print:text-black">
            {overall_analysis.technical_gaps?.map((gap, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-500 font-bold mt-0.5">•</span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Question-by-Question Detailed Review */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0b1220] dark:text-white print:text-black">
            Question-by-Question Evaluation ({question_reviews.length} Questions Evaluated)
          </h2>
          <span className="text-xs text-neutral-500 dark:text-slate-400">Click to expand/collapse</span>
        </div>

        <div className="space-y-3">
          {question_reviews.map((qr) => {
            const isExpanded = expandedQuestions[qr.question_number];
            return (
              <div
                key={qr.question_number}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md overflow-hidden transition-all print:border-gray-300 print:bg-white"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleQuestion(qr.question_number)}
                  className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-blue-100 dark:bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-900 dark:text-sky-300 font-mono">
                        Q{qr.question_number}
                      </span>
                      <span className="text-xs font-bold text-neutral-500 dark:text-slate-400">
                        Score: {qr.individual_score}/100
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0b1220] dark:text-white leading-snug print:text-black">
                      {qr.question_text}
                    </h3>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${getScoreColor(
                        qr.individual_score
                      )}`}
                    >
                      {qr.individual_score} pts
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-neutral-400 dark:text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-400 dark:text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800/80 space-y-4 animate-fadeIn">
                    {/* Candidate Answer */}
                    <div className="rounded-xl bg-blue-50/40 dark:bg-slate-950/60 p-4 border border-blue-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-slate-400 block mb-1">
                        Your Submitted Response
                      </span>
                      <p className="text-xs text-neutral-700 dark:text-slate-200 leading-relaxed font-mono">
                        "{qr.candidate_answer}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* What was correct */}
                      <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 p-3.5 space-y-1.5">
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>What Was Correct</span>
                        </span>
                        <ul className="text-xs text-neutral-600 dark:text-slate-300 space-y-1">
                          {qr.what_was_correct?.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* What was missing */}
                      <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 p-3.5 space-y-1.5">
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Missing Concepts</span>
                        </span>
                        <ul className="text-xs text-neutral-600 dark:text-slate-300 space-y-1">
                          {qr.what_was_missing?.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Suggested Model Answer */}
                    {qr.suggested_improved_answer && (
                      <div className="rounded-xl border border-blue-200 dark:border-slate-800 bg-blue-50/30 dark:bg-slate-950/70 p-4 space-y-1.5">
                        <span className="text-[11px] font-bold text-blue-800 dark:text-sky-400 flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5" />
                          <span>Suggested Model Answer Strategy</span>
                        </span>
                        <p className="text-xs text-neutral-600 dark:text-slate-300 leading-relaxed">
                          {qr.suggested_improved_answer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5 Additional Practice Questions */}
      {final_recommendation?.five_additional_practice_questions?.length > 0 && (
        <div className="rounded-3xl border border-blue-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-sm space-y-4 print:border-gray-300 print:bg-white print:text-black">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-cyan-400">
            <Target className="h-4 w-4" />
            <span>5 Recommended Practice Questions For Your Next Round</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {final_recommendation.five_additional_practice_questions.map((q, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-blue-50/40 dark:bg-slate-950/60 p-4 text-xs font-medium text-[#0b1220] dark:text-slate-200 print:border-gray-200 print:text-black"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-cyan-500/20 text-blue-800 dark:text-cyan-300 font-mono font-bold text-[10px]">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{q}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
