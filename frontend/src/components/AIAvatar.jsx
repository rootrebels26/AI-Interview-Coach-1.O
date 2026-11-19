import React from 'react';
import { Volume2, Sparkles, RefreshCw } from 'lucide-react';

export const PERSONAS = {
  alex: {
    id: 'alex',
    name: 'Alex Vance',
    role: 'Principal Tech Lead',
    gender: 'male',
    accentColor: 'from-cyan-400 via-blue-500 to-indigo-600',
    shadowColor: 'shadow-cyan-500/25',
  },
  elena: {
    id: 'elena',
    name: 'Elena Rostova',
    role: 'Engineering Director',
    gender: 'female',
    accentColor: 'from-sky-400 via-indigo-500 to-purple-600',
    shadowColor: 'shadow-purple-500/25',
  },
};

export default function AIAvatar({
  isSpeaking,
  isListening,
  isAnalyzing,
  company = 'Google',
  currentQuestionText = '',
  spokenPrompt = '',
  partTitle = '',
  partProgress = '',
  personaKey = 'alex',
  onPersonaChange,
  onReplay,
}) {
  const persona = PERSONAS[personaKey] || PERSONAS.alex;
  const isAlex = persona.id === 'alex';

  const handleToggle = () => {
    const nextKey = isAlex ? 'elena' : 'alex';
    onPersonaChange?.(nextKey);
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#0b1220] via-[#07111f] to-[#020617] flex items-center justify-center select-none">
      {/* Background Studio Elements with Nitya Cyan/Blue Glow */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(15,23,42,0.6)_0%,rgba(7,17,31,0.95)_100%)]" />
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-[#020617]/90 to-transparent" />
      </div>

      {/* Top-Left Interviewer HUD */}
      <div className="absolute top-3.5 left-3.5 z-30 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-md shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <div className="leading-tight">
            <p className="text-[11px] font-bold text-white tracking-tight">{persona.name}</p>
            <p className="text-[9px] font-medium text-slate-400">{persona.role}</p>
          </div>
        </div>
      </div>

      {/* Top-Right Persona & Voice Switcher Pill */}
      <div className="absolute top-3.5 right-3.5 z-30">
        <button
          type="button"
          onClick={handleToggle}
          title={`Switch Interviewer Voice & Persona (Current: ${persona.name})`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white text-[11px] font-semibold backdrop-blur-md shadow-lg transition-all cursor-pointer group"
        >
          <RefreshCw className="h-3 w-3 text-cyan-400 group-hover:rotate-180 transition-transform duration-500" />
          <span>{isAlex ? 'Alex' : 'Elena'}</span>
          <span
            className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${
              isAlex ? 'bg-cyan-500/20 text-cyan-300' : 'bg-purple-500/20 text-purple-300'
            }`}
          >
            {isAlex ? 'M' : 'F'}
          </span>
        </button>
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

        {/* Listening Ambient Glow */}
        {isListening && (
          <div className="absolute -inset-8 rounded-full bg-amber-400/15 blur-2xl animate-pulse pointer-events-none" />
        )}

        {/* Professional Interviewer Avatar Portrait Frame */}
        <div
          className={`relative h-32 w-32 sm:h-44 sm:w-44 md:h-52 md:w-52 rounded-full p-1 bg-gradient-to-tr ${persona.accentColor} shadow-2xl ${persona.shadowColor} transition-all duration-500`}
        >
          <div className="h-full w-full rounded-full overflow-hidden bg-slate-900 border-2 border-slate-950 relative flex items-center justify-center">
            {/* SVG Vector Avatar with Male (Alex) & Female (Elena) Variations */}
            <svg
              className="h-full w-full object-cover"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="skin" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isAlex ? '#C68662' : '#D19275'} />
                  <stop offset="100%" stopColor={isAlex ? '#8D5538' : '#9E5B3D'} />
                </linearGradient>
                <linearGradient id="blazer" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isAlex ? '#1E293B' : '#1e1b4b'} />
                  <stop offset="100%" stopColor={isAlex ? '#0F172A' : '#0f172a'} />
                </linearGradient>
                <linearGradient id="hair" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isAlex ? '#2A1B14' : '#3d2314'} />
                  <stop offset="100%" stopColor={isAlex ? '#120B07' : '#1a0d07'} />
                </linearGradient>
                <linearGradient id="shirt" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F8FAFC" />
                  <stop offset="100%" stopColor="#CBD5E1" />
                </linearGradient>
                <linearGradient id="tie" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>
              </defs>

              {/* Background gradient within avatar circle */}
              <circle cx="100" cy="100" r="100" fill="#172554" opacity="0.6" />

              {/* Hair Back */}
              {isAlex ? (
                <>
                  <circle cx="100" cy="85" r="54" fill="url(#hair)" />
                  <circle cx="70" cy="90" r="28" fill="url(#hair)" />
                  <circle cx="130" cy="90" r="28" fill="url(#hair)" />
                  <circle cx="65" cy="110" r="22" fill="url(#hair)" />
                  <circle cx="135" cy="110" r="22" fill="url(#hair)" />
                </>
              ) : (
                /* Elena: Longer, elegant styled wavy hair */
                <>
                  <circle cx="100" cy="85" r="56" fill="url(#hair)" />
                  <ellipse cx="62" cy="105" rx="26" ry="42" fill="url(#hair)" />
                  <ellipse cx="138" cy="105" rx="26" ry="42" fill="url(#hair)" />
                  <circle cx="58" cy="138" r="18" fill="url(#hair)" />
                  <circle cx="142" cy="138" r="18" fill="url(#hair)" />
                </>
              )}

              {/* Neck */}
              <rect
                x={isAlex ? '88' : '90'}
                y="112"
                width={isAlex ? '24' : '20'}
                height="28"
                rx="4"
                fill="url(#skin)"
              />

              {/* Head / Face */}
              <ellipse
                cx="100"
                cy="92"
                rx={isAlex ? '34' : '32'}
                ry={isAlex ? '40' : '39'}
                fill="url(#skin)"
              />

              {/* Hair Front Styling */}
              {isAlex ? (
                <>
                  <path
                    d="M66 84 C64 60, 80 42, 100 42 C120 42, 136 60, 134 84 C128 70, 116 62, 100 62 C84 62, 72 70, 66 84 Z"
                    fill="url(#hair)"
                  />
                  <circle cx="68" cy="74" r="14" fill="url(#hair)" />
                  <circle cx="132" cy="74" r="14" fill="url(#hair)" />
                </>
              ) : (
                <>
                  {/* Elena: Soft parted bangs and wave curls */}
                  <path
                    d="M64 86 C62 56, 80 40, 100 40 C122 40, 138 56, 136 86 C126 66, 112 58, 98 58 C82 58, 70 68, 64 86 Z"
                    fill="url(#hair)"
                  />
                  <ellipse cx="72" cy="70" rx="16" ry="12" fill="url(#hair)" />
                  <ellipse cx="128" cy="70" rx="16" ry="12" fill="url(#hair)" />
                </>
              )}

              {/* Eyes */}
              <ellipse cx="88" cy="88" rx="4.5" ry="5.5" fill="#1E293B" />
              <ellipse cx="112" cy="88" rx="4.5" ry="5.5" fill="#1E293B" />
              <circle cx="89.5" cy="86.5" r="1.8" fill="#FFFFFF" />
              <circle cx="113.5" cy="86.5" r="1.8" fill="#FFFFFF" />

              {/* Eyebrows */}
              <path
                d={isAlex ? 'M81 80 Q88 77 94 81' : 'M81 80 Q88 76 94 80'}
                stroke="#120B07"
                strokeWidth={isAlex ? '2.2' : '1.8'}
                strokeLinecap="round"
              />
              <path
                d={isAlex ? 'M106 81 Q112 77 119 80' : 'M106 80 Q112 76 119 80'}
                stroke="#120B07"
                strokeWidth={isAlex ? '2.2' : '1.8'}
                strokeLinecap="round"
              />

              {/* Nose */}
              <path
                d="M99 90 L98 97 L102 97"
                stroke="#6F3F27"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Mouth with Speaking Animation */}
              {isSpeaking ? (
                <path
                  d="M92 106 Q100 115 108 106 Z"
                  fill="#7F1D1D"
                  stroke="#5E1414"
                  strokeWidth="1"
                />
              ) : (
                <path
                  d="M92 106 Q100 113 108 106"
                  stroke="#5E1414"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                />
              )}

              {/* Elena Pearl Necklace / Alex Collared Tie */}
              {isAlex ? (
                <>
                  <path d="M60 200 L76 138 L100 156 L124 138 L140 200 Z" fill="url(#shirt)" />
                  {/* Tie */}
                  <path d="M97 150 L103 150 L105 185 L100 195 L95 185 Z" fill="url(#tie)" />
                  <path d="M42 200 L72 136 L94 170 L86 200 Z" fill="url(#blazer)" />
                  <path d="M158 200 L128 136 L106 170 L114 200 Z" fill="url(#blazer)" />
                </>
              ) : (
                <>
                  <path d="M65 200 L78 138 L100 154 L122 138 L135 200 Z" fill="url(#shirt)" />
                  {/* Elegant Pearl Necklace */}
                  <circle cx="92" cy="144" r="2.2" fill="#F8FAFC" />
                  <circle cx="96" cy="147" r="2.4" fill="#F8FAFC" />
                  <circle cx="100" cy="148" r="2.6" fill="#F8FAFC" />
                  <circle cx="104" cy="147" r="2.4" fill="#F8FAFC" />
                  <circle cx="108" cy="144" r="2.2" fill="#F8FAFC" />
                  <path d="M42 200 L72 136 L94 170 L86 200 Z" fill="url(#blazer)" />
                  <path d="M158 200 L128 136 L106 170 L114 200 Z" fill="url(#blazer)" />
                </>
              )}
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

      {/* Lower-Third Subtitle Glassmorphism Banner */}
      <div className="absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 z-20">
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b1220]/85 p-3 sm:p-4 backdrop-blur-xl shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-700 text-white shadow-md shadow-cyan-500/20 mt-0.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-0.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {persona.name}
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
