import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, RefreshCw, Radio } from 'lucide-react';

export const PERSONAS = {
  alex: {
    id: 'alex',
    name: 'Alex Vance',
    role: 'Principal Tech Lead',
    gender: 'male',
    tag: 'Tech Lead • AI Panel',
    accentGrad: 'from-cyan-400 via-sky-500 to-blue-600',
    haloColor: 'rgba(56, 189, 248, 0.4)',
    skinBase: '#c68a68',
    skinShadow: '#a66848',
    skinHighlight: '#dd9f7d',
    hairColor: '#201612',
    hairHighlight: '#3d2b23',
    blazerColor: '#172554',
    blazerLapel: '#0f172a',
    shirtColor: '#f8fafc',
    tieColor: '#0284c7',
  },
  elena: {
    id: 'elena',
    name: 'Elena Rostova',
    role: 'Engineering Director',
    gender: 'female',
    tag: 'Director • AI Panel',
    accentGrad: 'from-sky-400 via-indigo-500 to-purple-600',
    haloColor: 'rgba(168, 85, 247, 0.4)',
    skinBase: '#d29676',
    skinShadow: '#b07254',
    skinHighlight: '#e5ab8c',
    hairColor: '#2b1a11',
    hairHighlight: '#4a2e1e',
    blazerColor: '#1e1b4b',
    blazerLapel: '#0f172a',
    shirtColor: '#f1f5f9',
    pearlColor: '#ffffff',
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

  // Mouse gaze tracking for realistic micro-gaze parallax
  const [gaze, setGaze] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const nx = ((e.clientX / innerWidth) - 0.5) * 2;
      const ny = ((e.clientY / innerHeight) - 0.5) * 2;
      setGaze({
        x: Math.max(-1, Math.min(1, nx)),
        y: Math.max(-1, Math.min(1, ny)),
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleToggle = () => {
    const nextKey = isAlex ? 'elena' : 'alex';
    onPersonaChange?.(nextKey);
  };

  const handleAvatarClick = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (_) {}
    }
    if (onReplay) {
      onReplay();
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#0b1220] via-[#07111f] to-[#020617] flex items-center justify-center select-none">
      <style>{`
        @keyframes cartoonBreathing {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3.5px); }
        }
        @keyframes cartoonListeningNod {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(3.5px) rotate(1.2deg); }
          50% { transform: translateY(0.5px) rotate(0.2deg); }
          75% { transform: translateY(3px) rotate(1deg); }
        }
        @keyframes cartoonAnalyzingTilt {
          0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
          50% { transform: translateY(-2px) rotate(1.2deg); }
        }
        @keyframes cartoonEyeBlink {
          0%, 93%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.08); }
        }
        @keyframes cartoonMouthSpeak {
          0%, 100% {
            transform: scale(1, 0.45);
            opacity: 0.85;
          }
          18% {
            transform: scale(1.15, 1.4);
            opacity: 1;
          }
          36% {
            transform: scale(0.9, 0.6);
            opacity: 0.9;
          }
          54% {
            transform: scale(1.22, 1.7);
            opacity: 1;
          }
          72% {
            transform: scale(1.05, 1.15);
            opacity: 0.95;
          }
          88% {
            transform: scale(0.95, 0.55);
            opacity: 0.85;
          }
        }
        @keyframes cartoonEyebrowSpeak {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        @keyframes soundwavePulseRing {
          0% { transform: scale(0.96); opacity: 0.7; }
          50% { transform: scale(1.18); opacity: 0.15; }
          100% { transform: scale(1.32); opacity: 0; }
        }
        .anim-cartoon-head {
          transform-box: view-box;
          transform-origin: 100px 140px;
          animation: cartoonBreathing 4.5s ease-in-out infinite;
        }
        .anim-cartoon-head.listening {
          transform-box: view-box;
          transform-origin: 100px 140px;
          animation: cartoonListeningNod 3.4s ease-in-out infinite;
        }
        .anim-cartoon-head.analyzing {
          transform-box: view-box;
          transform-origin: 100px 140px;
          animation: cartoonAnalyzingTilt 4.2s ease-in-out infinite;
        }
        .anim-cartoon-eyeblink {
          transform-box: fill-box;
          transform-origin: center;
          animation: cartoonEyeBlink 4.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .anim-cartoon-mouth-speak {
          transform-box: fill-box;
          transform-origin: center;
          animation: cartoonMouthSpeak 0.28s ease-in-out infinite;
        }
        .anim-cartoon-eyebrow-speak {
          transform-box: fill-box;
          transform-origin: center;
          animation: cartoonEyebrowSpeak 0.6s ease-in-out infinite;
        }
        .anim-wave-ring-1 {
          animation: soundwavePulseRing 1.8s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
        }
        .anim-wave-ring-2 {
          animation: soundwavePulseRing 1.8s cubic-bezier(0.2, 0.8, 0.4, 1) infinite 0.6s;
        }
      `}</style>

      {/* Atmospheric Background Studio Lighting */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(15,23,42,0.6)_0%,rgba(7,17,31,0.95)_100%)]" />
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-[#020617]/90 to-transparent" />
      </div>

      {/* Top-Left Interviewer Persona Status Badge */}
      <div className="absolute top-3.5 left-3.5 z-30 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900/85 backdrop-blur-md shadow-lg">
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

      {/* Top-Right Persona Switcher Button (Alex / Elena) */}
      <div className="absolute top-3.5 right-3.5 z-30">
        <button
          type="button"
          onClick={handleToggle}
          title={`Switch Interviewer Persona & Voice (Current: ${persona.name})`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-slate-900/85 hover:bg-slate-800 text-slate-200 hover:text-white text-[11px] font-semibold backdrop-blur-md shadow-lg transition-all cursor-pointer group"
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
      <div className="relative flex flex-col items-center justify-center z-10 pt-2 pb-14">
        {/* Animated Speaking Waveform Halo Rings */}
        {isSpeaking && (
          <>
            <div className="absolute -inset-7 rounded-full border-2 border-cyan-400/40 anim-wave-ring-1 pointer-events-none" />
            <div className="absolute -inset-14 rounded-full border border-blue-500/30 anim-wave-ring-2 pointer-events-none" />
          </>
        )}

        {/* Listening Ambient Glow */}
        {isListening && (
          <div className="absolute -inset-10 rounded-full bg-amber-400/15 blur-2xl animate-pulse pointer-events-none" />
        )}

        {/* Outer Glowing Portrait Ring Frame */}
        <div
          onClick={handleAvatarClick}
          title={onReplay ? `Click to hear ${persona.name} speak` : `${persona.name} Interviewer`}
          className={`relative h-44 w-44 sm:h-56 sm:w-56 md:h-64 md:w-64 rounded-full p-1.5 bg-gradient-to-tr ${
            isSpeaking
              ? 'from-cyan-400 via-sky-500 to-blue-600 shadow-[0_0_40px_rgba(56,189,248,0.5)]'
              : isListening
              ? 'from-amber-400 via-orange-500 to-amber-600 shadow-[0_0_35px_rgba(251,191,36,0.4)]'
              : isAnalyzing
              ? 'from-purple-400 via-indigo-500 to-cyan-500 shadow-[0_0_35px_rgba(168,85,247,0.4)]'
              : `${persona.accentGrad} shadow-[0_0_30px_rgba(6,182,212,0.3)]`
          } transition-all duration-500 ${onReplay ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
        >
          {/* Inner Studio Viewport */}
          <div className="h-full w-full rounded-full overflow-hidden bg-[#070e1a] border-2 border-slate-900 relative shadow-inner flex items-center justify-center">
            {/* Studio Backdrop Radial Halo */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 38%, ${persona.haloColor} 0%, rgba(7, 14, 26, 0.95) 75%)`,
              }}
            />

            {/* HIGH-FIDELITY ANIMATED 3D CARTOON CHARACTER SVG */}
            <svg
              className={`h-full w-full object-cover anim-cartoon-head ${
                isListening ? 'listening' : isAnalyzing ? 'analyzing' : ''
              }`}
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
              }}
            >
              <defs>
                {/* 3D Skin Shading */}
                <radialGradient id="faceGrad" cx="48%" cy="40%" r="55%">
                  <stop offset="0%" stopColor={persona.skinHighlight} />
                  <stop offset="65%" stopColor={persona.skinBase} />
                  <stop offset="100%" stopColor={persona.skinShadow} />
                </radialGradient>

                {/* Hair Shading */}
                <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={persona.hairHighlight} />
                  <stop offset="50%" stopColor={persona.hairColor} />
                  <stop offset="100%" stopColor="#0c0705" />
                </linearGradient>

                {/* Suit Blazer 3D Gradient */}
                <linearGradient id="suitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={persona.blazerColor} />
                  <stop offset="100%" stopColor={persona.blazerLapel} />
                </linearGradient>

                {/* Shirt Gradient */}
                <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>

                {/* Tie Gradient (Alex) */}
                <linearGradient id="tieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>

                {/* Eye Gloss Gradient */}
                <linearGradient id="eyeGloss" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>

              {/* Character Upper Body & Shoulders */}
              <g id="shoulders-torso">
                {/* Suit Back Layer */}
                <path
                  d="M25 200 C30 155, 60 135, 100 135 C140 135, 170 155, 175 200 Z"
                  fill="url(#suitGrad)"
                />

                {/* Crisp White Shirt Collar */}
                <path d="M72 136 L100 162 L128 136 L118 126 L100 134 L82 126 Z" fill="url(#shirtGrad)" />
                <path d="M86 128 L100 152 L114 128 Z" fill="#e2e8f0" />

                {isAlex ? (
                  /* Alex: Executive Silk Tie */
                  <g id="alex-tie">
                    {/* Tie Knot */}
                    <path d="M94 136 L106 136 L108 144 L100 148 L92 144 Z" fill="url(#tieGrad)" />
                    {/* Tie Blade */}
                    <path d="M95 146 L105 146 L108 190 L100 200 L92 190 Z" fill="url(#tieGrad)" />
                    {/* Tie Highlight Line */}
                    <path d="M97 148 L99 188" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  </g>
                ) : (
                  /* Elena: Elegant Pearl Necklace */
                  <g id="elena-pearls">
                    <circle cx="88" cy="142" r="2.6" fill="#ffffff" />
                    <circle cx="94" cy="146" r="2.8" fill="#ffffff" />
                    <circle cx="100" cy="148" r="3.2" fill="#ffffff" />
                    <circle cx="106" cy="146" r="2.8" fill="#ffffff" />
                    <circle cx="112" cy="142" r="2.6" fill="#ffffff" />
                  </g>
                )}

                {/* Suit Lapels (Front Left & Right) */}
                <path
                  d="M32 200 C38 160, 68 136, 88 136 L98 178 L78 200 Z"
                  fill="url(#suitGrad)"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <path
                  d="M168 200 C162 160, 132 136, 112 136 L102 178 L122 200 Z"
                  fill="url(#suitGrad)"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
              </g>

              {/* Back Hair Volume */}
              <g id="hair-back">
                {isAlex ? (
                  <>
                    <ellipse cx="100" cy="85" rx="44" ry="48" fill="url(#hairGrad)" />
                    <circle cx="68" cy="88" r="18" fill="url(#hairGrad)" />
                    <circle cx="132" cy="88" r="18" fill="url(#hairGrad)" />
                  </>
                ) : (
                  <>
                    {/* Elena: Long Layered Wavy Brunette Hair */}
                    <ellipse cx="100" cy="86" rx="46" ry="52" fill="url(#hairGrad)" />
                    <ellipse cx="60" cy="115" rx="20" ry="38" fill="url(#hairGrad)" />
                    <ellipse cx="140" cy="115" rx="20" ry="38" fill="url(#hairGrad)" />
                    <circle cx="56" cy="146" r="16" fill="url(#hairGrad)" />
                    <circle cx="144" cy="146" r="16" fill="url(#hairGrad)" />
                  </>
                )}
              </g>

              {/* Neck with Shadow */}
              <g id="neck">
                <rect x="86" y="108" width="28" height="32" rx="4" fill={persona.skinShadow} />
                <rect x="88" y="112" width="24" height="26" rx="3" fill="url(#faceGrad)" />
              </g>

              {/* Head / Face Shape */}
              <g id="head-base">
                {/* 3D Shaded Jaw and Cheeks */}
                <ellipse cx="100" cy="90" rx="35" ry="42" fill="url(#faceGrad)" />

                {/* Ears */}
                <ellipse cx="64" cy="90" rx="5.5" ry="8.5" fill={persona.skinBase} />
                <ellipse cx="64" cy="90" rx="3" ry="5" fill={persona.skinShadow} />
                <ellipse cx="136" cy="90" rx="5.5" ry="8.5" fill={persona.skinBase} />
                <ellipse cx="136" cy="90" rx="3" ry="5" fill={persona.skinShadow} />

                {/* Soft Cheek Rosy Blushes */}
                <ellipse cx="76" cy="96" rx="8" ry="4" fill="#fb7185" opacity="0.18" />
                <ellipse cx="124" cy="96" rx="8" ry="4" fill="#fb7185" opacity="0.18" />
              </g>

              {/* Eyes & Blinking Group */}
              <g id="eyes-group" className="anim-cartoon-eyeblink">
                {/* Left Eye Sclera */}
                <ellipse cx="85" cy="86" rx="6.5" ry="7.5" fill="#ffffff" />
                {/* Right Eye Sclera */}
                <ellipse cx="115" cy="86" rx="6.5" ry="7.5" fill="#ffffff" />

                {/* Left Eye Iris with Parallax Gaze */}
                <ellipse
                  cx={85 + gaze.x * 1.8}
                  cy={86 + gaze.y * 1.4}
                  rx="4.2"
                  ry="4.8"
                  fill="url(#eyeGloss)"
                />
                {/* Right Eye Iris with Parallax Gaze */}
                <ellipse
                  cx={115 + gaze.x * 1.8}
                  cy={86 + gaze.y * 1.4}
                  rx="4.2"
                  ry="4.8"
                  fill="url(#eyeGloss)"
                />

                {/* Pupils */}
                <circle cx={85 + gaze.x * 1.8} cy={86 + gaze.y * 1.4} r="2.2" fill="#000000" />
                <circle cx={115 + gaze.x * 1.8} cy={86 + gaze.y * 1.4} r="2.2" fill="#000000" />

                {/* Catchlight Highlights (sparkle in eye) */}
                <circle cx={83.5 + gaze.x * 1.2} cy={84 + gaze.y * 1.0} r="1.3" fill="#ffffff" />
                <circle cx={86.5 + gaze.x * 1.2} cy={87.5 + gaze.y * 1.0} r="0.7" fill="#ffffff" />
                <circle cx={113.5 + gaze.x * 1.2} cy={84 + gaze.y * 1.0} r="1.3" fill="#ffffff" />
                <circle cx={116.5 + gaze.x * 1.2} cy={87.5 + gaze.y * 1.0} r="0.7" fill="#ffffff" />

                {/* Upper Eyelash Lines */}
                <path
                  d="M78 83 Q85 79 92 83"
                  stroke={persona.hairColor}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M108 83 Q115 79 122 83"
                  stroke={persona.hairColor}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>

              {/* Expressive Eyebrows with Speaking Animations */}
              <g
                id="eyebrows"
                className={isSpeaking ? 'anim-cartoon-eyebrow-speak' : ''}
              >
                {/* Left Eyebrow */}
                <path
                  d={
                    isSpeaking
                      ? 'M78 77 Q85 71 92 76'
                      : isListening
                      ? 'M78 78 Q85 74 92 78'
                      : 'M78 78 Q85 73 92 77'
                  }
                  stroke={persona.hairColor}
                  strokeWidth={isAlex ? '2.8' : '2.0'}
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Right Eyebrow */}
                <path
                  d={
                    isSpeaking
                      ? 'M108 76 Q115 71 122 77'
                      : isListening
                      ? 'M108 78 Q115 74 122 78'
                      : 'M108 77 Q115 73 122 78'
                  }
                  stroke={persona.hairColor}
                  strokeWidth={isAlex ? '2.8' : '2.0'}
                  strokeLinecap="round"
                  fill="none"
                />
              </g>

              {/* Clean Stylized Nose */}
              <g id="nose">
                <path
                  d="M99 87 L97.5 96 Q100 98.5 102.5 96"
                  stroke={persona.skinShadow}
                  strokeWidth="2.0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <circle cx="100" cy="94" r="1.2" fill={persona.skinHighlight} opacity="0.8" />
              </g>

              {/* Dynamic Lip-Sync Animated Mouth */}
              <g id="mouth-group">
                {isSpeaking ? (
                  /* Animated Speaking Mouth with Dynamic Phoneme Modulation */
                  <g className="anim-cartoon-mouth-speak">
                    {/* Open Mouth Cavity */}
                    <ellipse cx="100" cy="107" rx="8.5" ry="6.5" fill="#4a0e10" />
                    {/* Upper White Teeth */}
                    <path d="M94 104 Q100 106 106 104" fill="none" stroke="#f8fafc" strokeWidth="2.2" strokeLinecap="round" />
                    {/* Lower Tongue */}
                    <ellipse cx="100" cy="109" rx="5" ry="3" fill="#e11d48" opacity="0.85" />
                    {/* Lip Contour Outline */}
                    <ellipse cx="100" cy="107" rx="9" ry="7" fill="none" stroke="#881337" strokeWidth="1.4" />
                  </g>
                ) : (
                  /* Professional Warm Executive Smile */
                  <g id="smile-neutral">
                    <path
                      d="M92 105 Q100 113 108 105"
                      stroke="#881337"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Smile Dimple Corners */}
                    <circle cx="91.5" cy="104.5" r="0.8" fill="#881337" />
                    <circle cx="108.5" cy="104.5" r="0.8" fill="#881337" />
                  </g>
                )}
              </g>

              {/* Front Hair Volume & Modern Executive Styling */}
              <g id="hair-front">
                {isAlex ? (
                  <>
                    {/* Alex: Sharp Tech Lead Pompadour / Modern Quiff */}
                    <path
                      d="M64 80 C62 52, 78 38, 100 38 C122 38, 138 52, 136 80 C128 65, 115 56, 100 56 C85 56, 72 65, 64 80 Z"
                      fill="url(#hairGrad)"
                    />
                    {/* Textured Hair Highlights */}
                    <path d="M80 50 Q96 42 112 46" stroke={persona.hairHighlight} strokeWidth="2.2" strokeLinecap="round" fill="none" />
                    <path d="M88 56 Q100 48 116 52" stroke={persona.hairHighlight} strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    <circle cx="67" cy="74" r="9" fill="url(#hairGrad)" />
                    <circle cx="133" cy="74" r="9" fill="url(#hairGrad)" />
                  </>
                ) : (
                  <>
                    {/* Elena: Soft Layered Parted Waves & Bangs */}
                    <path
                      d="M62 82 C60 50, 78 36, 100 36 C124 36, 138 50, 138 82 C126 62, 114 52, 98 52 C80 52, 68 62, 62 82 Z"
                      fill="url(#hairGrad)"
                    />
                    <path d="M76 60 Q88 44 104 46" stroke={persona.hairHighlight} strokeWidth="2.4" strokeLinecap="round" fill="none" />
                    <path d="M96 50 Q112 44 126 56" stroke={persona.hairHighlight} strokeWidth="2.0" strokeLinecap="round" fill="none" />
                    <ellipse cx="68" cy="74" rx="14" ry="16" fill="url(#hairGrad)" />
                    <ellipse cx="132" cy="74" rx="14" ry="16" fill="url(#hairGrad)" />
                  </>
                )}
              </g>

              {/* Studio Rim Light Sheen on Avatar */}
              <ellipse
                cx="100"
                cy="100"
                rx="98"
                ry="98"
                fill="none"
                stroke="url(#faceGrad)"
                strokeWidth="1.5"
                opacity="0.3"
              />
            </svg>

            {/* Speaking audio visualizer HUD bars */}
            {isSpeaking && (
              <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5 bg-slate-950/80 py-1.5 px-3 backdrop-blur-md rounded-full max-w-[130px] mx-auto border border-cyan-500/30 shadow-lg">
                <span className="h-2 w-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="h-4 w-1 bg-sky-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-5 w-1 bg-blue-400 rounded-full animate-bounce" />
                <span className="h-3 w-1 bg-sky-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              </div>
            )}
          </div>

          {/* Status Badge Pin (Online, Speaking, Listening, Analyzing) */}
          <div className="absolute -bottom-3 inset-x-0 flex justify-center z-20">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase backdrop-blur-xl shadow-xl border ${
                isSpeaking
                  ? 'bg-sky-500/25 border-sky-400/60 text-sky-200 shadow-sky-500/20'
                  : isListening
                  ? 'bg-amber-500/25 border-amber-400/60 text-amber-200 shadow-amber-500/20'
                  : isAnalyzing
                  ? 'bg-purple-500/25 border-purple-400/60 text-purple-200 shadow-purple-500/20'
                  : 'bg-emerald-500/25 border-emerald-400/60 text-emerald-200 shadow-emerald-500/20'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
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
              onClick={handleAvatarClick}
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
