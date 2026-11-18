import { Volume2, Sparkles, Activity } from 'lucide-react';

export default function AIAvatar({
  isSpeaking,
  isListening,
  isAnalyzing,
  company = 'Google',
  currentQuestionText = '',
  spokenPrompt = '',
  partTitle = '',
  partProgress = '',
  onReplay,
}) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#0b1220] via-[#07111f] to-[#020617] flex items-center justify-center select-none">
      {/* Background Studio Elements with Nitya Cyan/Blue Glow */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        {/* Soft studio light circles */}
        <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
        {/* Modern office background lines */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(15,23,42,0.6)_0%,rgba(7,17,31,0.95)_100%)]" />
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-[#020617]/90 to-transparent" />
      </div>

      {/* Main Avatar Graphic Container */}
      <div className="relative flex flex-col items-center justify-center z-10">
        {/* Animated Speaking Waveform Halo */}
        {isSpeaking && (
          <div className="absolute -inset-6 rounded-full border-2 border-cyan-400/50 animate-ping opacity-75 pointer-events-none" />
        )}
        {isSpeaking && (
          <div className="absolute -inset-12 rounded-full border border-blue-500/30 animate-pulse opacity-50 pointer-events-none" />
        )}

        {/* Professional Interviewer Avatar Portrait */}
        <div className="relative h-32 w-32 sm:h-44 sm:w-44 md:h-52 md:w-52 rounded-full p-1 bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 shadow-2xl shadow-cyan-500/25">
          <div className="h-full w-full rounded-full overflow-hidden bg-slate-900 border-2 border-slate-950 relative flex items-center justify-center">
            {/* Realistic stylized AI interviewer vector avatar */}
            <svg
              className="h-full w-full object-cover"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="skin" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C68662" />
                  <stop offset="100%" stopColor="#8D5538" />
                </linearGradient>
                <linearGradient id="blazer" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>
                <linearGradient id="hair" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2A1B14" />
                  <stop offset="100%" stopColor="#120B07" />
                </linearGradient>
                <linearGradient id="shirt" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F8FAFC" />
                  <stop offset="100%" stopColor="#CBD5E1" />
                </linearGradient>
              </defs>

              {/* Background gradient within avatar circle */}
              <circle cx="100" cy="100" r="100" fill="#172554" opacity="0.6" />

              {/* Hair Back */}
              <circle cx="100" cy="85" r="54" fill="url(#hair)" />
              <circle cx="70" cy="90" r="28" fill="url(#hair)" />
              <circle cx="130" cy="90" r="28" fill="url(#hair)" />
              <circle cx="65" cy="110" r="22" fill="url(#hair)" />
              <circle cx="135" cy="110" r="22" fill="url(#hair)" />

              {/* Neck */}
              <rect x="88" y="112" width="24" height="28" rx="4" fill="url(#skin)" />

              {/* Head / Face */}
              <ellipse cx="100" cy="92" rx="34" ry="40" fill="url(#skin)" />

              {/* Hair Front Curls */}
              <path
                d="M66 84 C64 60, 80 42, 100 42 C120 42, 136 60, 134 84 C128 70, 116 62, 100 62 C84 62, 72 70, 66 84 Z"
                fill="url(#hair)"
              />
              <circle cx="68" cy="74" r="14" fill="url(#hair)" />
              <circle cx="132" cy="74" r="14" fill="url(#hair)" />

              {/* Eyes */}
              <ellipse cx="88" cy="88" rx="4.5" ry="5.5" fill="#1E293B" />
              <ellipse cx="112" cy="88" rx="4.5" ry="5.5" fill="#1E293B" />
              <circle cx="89.5" cy="86.5" r="1.8" fill="#FFFFFF" />
              <circle cx="113.5" cy="86.5" r="1.8" fill="#FFFFFF" />

              {/* Eyebrows */}
              <path d="M81 80 Q88 77 94 81" stroke="#120B07" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M106 81 Q112 77 119 80" stroke="#120B07" strokeWidth="2.2" strokeLinecap="round" />

              {/* Nose */}
              <path d="M99 90 L98 97 L102 97" stroke="#6F3F27" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

              {/* Friendly Professional Smile */}
              {isSpeaking ? (
                <path d="M92 106 Q100 114 108 106 Z" fill="#7F1D1D" stroke="#5E1414" strokeWidth="1" />
              ) : (
                <path d="M92 106 Q100 113 108 106" stroke="#5E1414" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              )}

              {/* Modern Business Shirt & Navy Blazer */}
              <path d="M60 200 L76 138 L100 156 L124 138 L140 200 Z" fill="url(#shirt)" />
              <path d="M42 200 L72 136 L94 170 L86 200 Z" fill="url(#blazer)" />
              <path d="M158 200 L128 136 L106 170 L114 200 Z" fill="url(#blazer)" />
            </svg>

            {/* Speaking audio visualizer overlay at bottom of avatar */}
            {isSpeaking && (
              <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1 bg-slate-950/70 py-1 backdrop-blur-sm">
                <span className="h-2 w-1 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="h-3.5 w-1 bg-sky-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-4 w-1 bg-indigo-400 rounded-full animate-bounce" />
                <span className="h-3 w-1 bg-sky-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-1 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              </div>
            )}
          </div>

          {/* Status Badge Pin */}
          <div className="absolute -bottom-2 inset-x-0 flex justify-center">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase backdrop-blur-md shadow-lg border ${
                isSpeaking
                  ? 'bg-sky-500/20 border-sky-400/50 text-sky-200'
                  : isListening
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                  : isAnalyzing
                  ? 'bg-purple-500/20 border-purple-400/50 text-purple-200'
                  : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isSpeaking
                    ? 'bg-sky-400 animate-ping'
                    : isListening
                    ? 'bg-amber-400 animate-pulse'
                    : isAnalyzing
                    ? 'bg-purple-400 animate-spin'
                    : 'bg-emerald-400'
                }`}
              />
              <span>
                {isSpeaking
                  ? 'Speaking...'
                  : isListening
                  ? 'Listening...'
                  : isAnalyzing
                  ? 'Analyzing...'
                  : 'Online'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Lower-Third Subtitle Glassmorphism Banner (matching Nitya CloudTech theme) */}
      <div className="absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 z-20">
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b1220]/85 p-3 sm:p-4 backdrop-blur-xl shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-700 text-white shadow-md shadow-cyan-500/20 mt-0.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-0.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  InterviewBot 3.0 (AI)
                </span>
                <span className="text-[10px] text-cyan-300/80 font-medium">
                  {partTitle && partProgress
                    ? `${partTitle} (${partProgress}) • ${company} Board`
                    : `${company} Interview Board • Nitya AI`}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed line-clamp-3">
                {spokenPrompt || currentQuestionText || 'Waiting for interview to begin...'}
              </p>
            </div>
          </div>

          {onReplay && (
            <button
              type="button"
              onClick={onReplay}
              title="Replay Spoken Question"
              className="shrink-0 flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:border-cyan-400 hover:text-cyan-300 transition-all cursor-pointer"
            >
              <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Replay</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
