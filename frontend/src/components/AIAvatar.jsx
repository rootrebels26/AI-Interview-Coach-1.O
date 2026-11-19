import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Sparkles, User, RefreshCw, Radio } from 'lucide-react';

const PERSONAS = {
  alex: {
    id: 'alex',
    name: 'Alex Vance',
    role: 'Principal Tech Lead',
    image: '/interviewer_human.jpg',
    skinTone: '#a37152',
    accentColor: 'from-cyan-500 to-blue-600',
    eyePositions: {
      left: { left: '39%', top: '38%', width: '9%', height: '5%' },
      right: { left: '52%', top: '38%', width: '9%', height: '5%' },
    },
    mouthPosition: { left: '44%', top: '58%', width: '13%', height: '7%' },
  },
  elena: {
    id: 'elena',
    name: 'Elena Rostova',
    role: 'Engineering Director',
    image: '/interviewer_female.jpg',
    skinTone: '#b88365',
    accentColor: 'from-blue-500 to-indigo-600',
    eyePositions: {
      left: { left: '39%', top: '38%', width: '9%', height: '5%' },
      right: { left: '52%', top: '38%', width: '9%', height: '5%' },
    },
    mouthPosition: { left: '44%', top: '58%', width: '13%', height: '7%' },
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
  onReplay,
}) {
  const [personaKey, setPersonaKey] = useState('alex');
  const persona = PERSONAS[personaKey];

  // Head and gaze tracking offsets
  const [gazeOffset, setGazeOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [visemeStage, setVisemeStage] = useState(0);

  // Parallax tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      // Normalized between -1 and 1
      const nx = (e.clientX / innerWidth - 0.5) * 2;
      const ny = (e.clientY / innerHeight - 0.5) * 2;
      // Head tilt up to 4 degrees, translation up to 6px
      setGazeOffset({
        x: Math.max(-1, Math.min(1, nx)),
        y: Math.max(-1, Math.min(1, ny)),
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Autonomous Lifelike Eye Blinking System (every 3.2 - 5.5 seconds)
  useEffect(() => {
    let timeoutId;
    const scheduleNextBlink = () => {
      const delay = 3200 + Math.random() * 2400;
      timeoutId = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          // Occasional double-blink for hyper-realism
          if (Math.random() < 0.25) {
            setTimeout(() => {
              setIsBlinking(true);
              setTimeout(() => {
                setIsBlinking(false);
                scheduleNextBlink();
              }, 120);
            }, 100);
          } else {
            scheduleNextBlink();
          }
        }, 140);
      }, delay);
    };

    scheduleNextBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  // Speech Viseme / Lip-Sync Articulation Cycling when isSpeaking is active
  useEffect(() => {
    if (!isSpeaking) {
      setVisemeStage(0);
      return;
    }

    // Cycles visemes at conversational syllabic rhythm (80 - 150ms)
    const interval = setInterval(() => {
      setVisemeStage((prev) => (prev + 1) % 6);
    }, 110);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  const togglePersona = () => {
    setPersonaKey((k) => (k === 'alex' ? 'elena' : 'alex'));
  };

  // Viseme mouth shapes: 0=neutral closed, 1=open-wide, 2=jaw-drop, 3=rounded-O, 4=slight-open, 5=smile-speak
  const getMouthTransform = () => {
    if (!isSpeaking) return { scaleY: 0, opacity: 0 };
    switch (visemeStage) {
      case 1:
        return { scaleY: 1.5, scaleX: 1.15, opacity: 0.85, height: '14px', borderRadius: '40% 40% 60% 60%' };
      case 2:
        return { scaleY: 2.1, scaleX: 0.95, opacity: 0.95, height: '18px', borderRadius: '35% 35% 65% 65%' };
      case 3:
        return { scaleY: 1.6, scaleX: 0.8, opacity: 0.9, height: '15px', borderRadius: '50%' };
      case 4:
        return { scaleY: 1.2, scaleX: 1.1, opacity: 0.8, height: '11px', borderRadius: '45%' };
      case 5:
        return { scaleY: 1.8, scaleX: 1.2, opacity: 0.9, height: '16px', borderRadius: '30% 30% 70% 70%' };
      default:
        return { scaleY: 0.5, scaleX: 1.0, opacity: 0.4, height: '8px', borderRadius: '50%' };
    }
  };

  const mouthStyle = getMouthTransform();

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#0b1220] via-[#07111f] to-[#020617] flex items-center justify-center select-none">
      <style>{`
        @keyframes avatarBreathing {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-3px) scale(1.008);
          }
        }
        @keyframes listeningNod {
          0%, 100% {
            transform: translateY(0) rotateX(0deg);
          }
          30% {
            transform: translateY(3.5px) rotateX(2.5deg);
          }
          60% {
            transform: translateY(1px) rotateX(1deg);
          }
          75% {
            transform: translateY(3px) rotateX(2deg);
          }
        }
        @keyframes analyzingGaze {
          0%, 100% {
            transform: translateY(0) rotate(-0.5deg);
          }
          50% {
            transform: translateY(-2px) rotate(1deg);
          }
        }
        @keyframes speechPulseHalo {
          0% {
            transform: scale(0.96);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.15;
          }
          100% {
            transform: scale(1.28);
            opacity: 0;
          }
        }
        .animate-avatar-breath {
          animation: avatarBreathing 5.4s ease-in-out infinite;
        }
        .animate-listening-nod {
          animation: listeningNod 3.2s ease-in-out infinite;
        }
        .animate-analyzing-gaze {
          animation: analyzingGaze 4s ease-in-out infinite;
        }
        .animate-speech-halo-1 {
          animation: speechPulseHalo 1.8s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
        }
        .animate-speech-halo-2 {
          animation: speechPulseHalo 1.8s cubic-bezier(0.2, 0.8, 0.4, 1) infinite 0.6s;
        }
      `}</style>

      {/* Atmospheric Studio Lighting Elements */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute -top-12 -left-12 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 h-72 w-72 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(14,165,233,0.1)_0%,rgba(7,17,31,0.95)_75%)]" />
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-[#020617]/95 via-[#020617]/60 to-transparent" />
      </div>

      {/* Switch Persona Pill in Top-Right Corner */}
      <div className="absolute top-3.5 right-3.5 z-30">
        <button
          type="button"
          onClick={togglePersona}
          title={`Switch Interviewer Persona (Current: ${persona.name})`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white text-[11px] font-semibold backdrop-blur-md shadow-lg transition-all cursor-pointer group"
        >
          <RefreshCw className="h-3 w-3 text-cyan-400 group-hover:rotate-180 transition-transform duration-500" />
          <span>{persona.name.split(' ')[0]}</span>
          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
            {personaKey === 'alex' ? 'M' : 'F'}
          </span>
        </button>
      </div>

      {/* Interviewer Persona HUD Pill Top-Left */}
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

      {/* Main Avatar Graphic & Movement Stage */}
      <div className="relative flex flex-col items-center justify-center z-10 pt-2 pb-16">
        {/* Animated Speaking Waveform Halo Rings */}
        {isSpeaking && (
          <>
            <div className="absolute -inset-8 rounded-full border-2 border-cyan-400/40 animate-speech-halo-1 pointer-events-none" />
            <div className="absolute -inset-14 rounded-full border border-blue-500/30 animate-speech-halo-2 pointer-events-none" />
          </>
        )}

        {/* Listening Ambient Glow */}
        {isListening && (
          <div className="absolute -inset-10 rounded-full bg-amber-400/10 blur-2xl animate-pulse pointer-events-none" />
        )}

        {/* Outer Studio Rim Lighting Ring */}
        <div
          className={`relative h-44 w-44 sm:h-56 sm:w-56 md:h-64 md:w-64 rounded-full p-1.5 bg-gradient-to-tr ${
            isSpeaking
              ? 'from-cyan-400 via-sky-500 to-blue-600 shadow-[0_0_40px_rgba(56,189,248,0.45)]'
              : isListening
              ? 'from-amber-400 via-orange-500 to-amber-600 shadow-[0_0_35px_rgba(251,191,36,0.35)]'
              : isAnalyzing
              ? 'from-purple-400 via-indigo-500 to-cyan-500 shadow-[0_0_35px_rgba(168,85,247,0.35)]'
              : 'from-cyan-500 via-blue-600 to-indigo-700 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
          } transition-all duration-700`}
        >
          {/* Inner Studio Viewport with 3D Perspective */}
          <div
            className="h-full w-full rounded-full overflow-hidden bg-slate-950 border-2 border-slate-900 relative shadow-inner flex items-center justify-center"
            style={{ perspective: '800px' }}
          >
            {/* 3D Moving Head Canvas Container */}
            <div
              className={`relative w-full h-full rounded-full transition-transform duration-200 ease-out ${
                isSpeaking
                  ? 'animate-avatar-breath'
                  : isListening
                  ? 'animate-listening-nod'
                  : isAnalyzing
                  ? 'animate-analyzing-gaze'
                  : 'animate-avatar-breath'
              }`}
              style={{
                transform: `
                  rotateY(${gazeOffset.x * 4.5}deg)
                  rotateX(${-gazeOffset.y * 3.5}deg)
                  translateX(${gazeOffset.x * 4}px)
                  translateY(${gazeOffset.y * 3}px)
                  ${isListening ? 'scale(1.035)' : 'scale(1)'}
                `,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Photorealistic Human Portrait Image */}
              <img
                src={persona.image}
                alt={persona.name}
                className="w-full h-full object-cover object-top select-none pointer-events-none transition-all duration-500"
                style={{
                  filter: isSpeaking
                    ? 'contrast(1.03) brightness(1.02)'
                    : isListening
                    ? 'contrast(1.02) brightness(1.04)'
                    : 'contrast(1.0) brightness(1.0)',
                }}
              />

              {/* Realistic Eye Blinking Overlays (Left & Right Eyelids) */}
              <div
                className="absolute pointer-events-none transition-all duration-100 ease-out"
                style={{
                  ...persona.eyePositions.left,
                  backgroundColor: persona.skinTone,
                  transform: isBlinking ? 'scaleY(1)' : 'scaleY(0)',
                  transformOrigin: 'top center',
                  borderRadius: '50% 50% 40% 40%',
                  opacity: isBlinking ? 0.95 : 0,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                }}
              />
              <div
                className="absolute pointer-events-none transition-all duration-100 ease-out"
                style={{
                  ...persona.eyePositions.right,
                  backgroundColor: persona.skinTone,
                  transform: isBlinking ? 'scaleY(1)' : 'scaleY(0)',
                  transformOrigin: 'top center',
                  borderRadius: '50% 50% 40% 40%',
                  opacity: isBlinking ? 0.95 : 0,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                }}
              />

              {/* Dynamic Phoneme Lip-Sync & Jaw Articulation Overlay */}
              {isSpeaking && (
                <div
                  className="absolute pointer-events-none flex items-center justify-center transition-all duration-75"
                  style={{
                    ...persona.mouthPosition,
                    transform: `translate(-50%, -50%) scale(${mouthStyle.scaleX || 1}, ${
                      mouthStyle.scaleY || 1
                    })`,
                    left: '50%',
                  }}
                >
                  <div
                    className="w-full bg-[#3c1514] border border-[#5a2120]/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] transition-all duration-75"
                    style={{
                      height: mouthStyle.height || '10px',
                      borderRadius: mouthStyle.borderRadius || '50%',
                      opacity: mouthStyle.opacity || 0.85,
                    }}
                  >
                    {/* Inner teeth / mouth depth highlight */}
                    <div className="w-2/3 h-1 mx-auto bg-slate-200/40 rounded-full mt-0.5" />
                  </div>
                </div>
              )}

              {/* Dynamic Jaw / Lower Face Breathing Shift */}
              <div
                className="absolute bottom-0 inset-x-0 h-16 pointer-events-none bg-gradient-to-t from-slate-950/40 to-transparent"
                style={{
                  transform: isSpeaking ? `translateY(${visemeStage % 2 === 0 ? 1.5 : 0}px)` : 'none',
                  transition: 'transform 90ms ease-out',
                }}
              />

              {/* Subtle Camera Light Lens Sheen */}
              <div className="absolute inset-0 pointer-events-none rounded-full bg-gradient-to-tr from-transparent via-cyan-400/5 to-white/10" />
            </div>

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

          {/* Status Badge Pin */}
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
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b1220]/90 p-3 sm:p-4 backdrop-blur-xl shadow-2xl">
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
