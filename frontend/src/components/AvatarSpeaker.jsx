// Avatar display that speaks AI replies through the browser speech API.
import { useEffect, useState } from 'react';

const AvatarSpeaker = ({ text, onSpeakStateChange = () => {}, image }) => {
    const [isTalking, setIsTalking] = useState(false);

    useEffect(() => {
        if (!text) return;

        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = synth.getVoices();
        const preferredVoices = voices.filter((voice) =>
            voice.name.includes('Google') ||
            voice.name.includes('Natural') ||
            voice.name.includes('Microsoft')
        );

        utterance.voice =
            preferredVoices.find((voice) => voice.name.includes('Google US English')) ||
            preferredVoices[0] ||
            voices[0];

        utterance.rate = 0.95;
        utterance.pitch = 0.92;
        utterance.volume = 1;

        utterance.onstart = () => {
            setIsTalking(true);
            onSpeakStateChange(true);
        };

        utterance.onend = () => {
            setIsTalking(false);
            onSpeakStateChange(false);
        };

        utterance.onerror = () => {
            setIsTalking(false);
            onSpeakStateChange(false);
        };

        synth.cancel();
        synth.speak(utterance);

        return () => {
            synth.cancel();
            setIsTalking(false);
            onSpeakStateChange(false);
        };
    }, [text, onSpeakStateChange]);

    return (
        <div className="relative grid h-72 w-72 place-items-center">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-sky-400/25 via-indigo-500/15 to-cyan-300/20 blur-2xl transition-opacity duration-500 ${isTalking ? 'opacity-100' : 'opacity-50'}`}></div>
            <div className={`absolute h-[17rem] w-[17rem] rounded-full border border-sky-400/30 transition-all duration-500 ${isTalking ? 'scale-105 opacity-100 animate-pulse' : 'scale-100 opacity-60'}`}></div>
            <div className="absolute h-60 w-60 rounded-full border border-slate-300/70 dark:border-white/10"></div>
            <div className="absolute h-52 w-52 rounded-full border border-sky-300/30 border-dashed"></div>

            <div className="relative h-56 w-56 overflow-hidden rounded-full border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 shadow-[0_28px_80px_rgba(15,23,42,0.25)] dark:border-white/10 dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(56,189,248,0.26),transparent_36%),radial-gradient(circle_at_28%_76%,rgba(99,102,241,0.24),transparent_34%)]"></div>
                <div className="absolute inset-x-8 top-10 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent"></div>
                <div className="absolute inset-x-10 bottom-9 h-px bg-gradient-to-r from-transparent via-indigo-300/50 to-transparent"></div>

                {image ? (
                    <img src={image} alt="AI interviewer avatar" className="absolute inset-0 h-full w-full object-cover opacity-90" />
                ) : (
                    <svg viewBox="0 0 240 240" className="relative h-full w-full">
                        <defs>
                            <linearGradient id="visorGradient" x1="50" x2="190" y1="80" y2="150" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#38bdf8" />
                                <stop offset="0.5" stopColor="#60a5fa" />
                                <stop offset="1" stopColor="#818cf8" />
                            </linearGradient>
                            <linearGradient id="shellGradient" x1="64" x2="176" y1="52" y2="190" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#e0f2fe" stopOpacity="0.92" />
                                <stop offset="1" stopColor="#94a3b8" stopOpacity="0.5" />
                            </linearGradient>
                        </defs>

                        <path d="M120 38c37 0 68 28 72 65l4 43c4 36-24 67-60 67h-32c-36 0-64-31-60-67l4-43c4-37 35-65 72-65Z" fill="url(#shellGradient)" opacity="0.9" />
                        <path d="M73 100c0-18 15-33 33-33h28c18 0 33 15 33 33v21c0 18-15 33-33 33h-28c-18 0-33-15-33-33v-21Z" fill="#0f172a" stroke="#7dd3fc" strokeOpacity="0.38" strokeWidth="3" />
                        <path d="M88 104c0-10 8-18 18-18h28c10 0 18 8 18 18v12c0 10-8 18-18 18h-28c-10 0-18-8-18-18v-12Z" fill="url(#visorGradient)" opacity={isTalking ? '0.55' : '0.32'} />

                        <circle cx="104" cy="110" r="6" fill={isTalking ? '#e0f2fe' : '#7dd3fc'} />
                        <circle cx="136" cy="110" r="6" fill={isTalking ? '#e0f2fe' : '#7dd3fc'} />
                        <path d={isTalking ? 'M104 134h32' : 'M110 134h20'} stroke="#bae6fd" strokeWidth="5" strokeLinecap="round" opacity="0.8" />

                        <path d="M87 169c14 9 52 9 66 0" stroke="#cbd5e1" strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" />
                        <path d="M120 38V22" stroke="#93c5fd" strokeWidth="4" strokeLinecap="round" />
                        <circle cx="120" cy="18" r="7" fill={isTalking ? '#38bdf8' : '#64748b'} />
                        <path d="M44 119h20M176 119h20" stroke="#94a3b8" strokeWidth="7" strokeLinecap="round" opacity="0.7" />

                        {isTalking && (
                            <g opacity="0.9">
                                <path d="M64 88c-10 9-15 20-15 32s5 23 15 32" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                                <path d="M176 88c10 9 15 20 15 32s-5 23-15 32" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                            </g>
                        )}
                    </svg>
                )}

                <div className={`absolute inset-x-8 bottom-6 grid grid-cols-5 gap-1 transition-opacity duration-300 ${isTalking ? 'opacity-100' : 'opacity-35'}`}>
                    {[12, 22, 34, 22, 12].map((height, index) => (
                        <span
                            key={index}
                            className="rounded-full bg-sky-300"
                            style={{ height: isTalking ? `${height}px` : '8px' }}
                        />
                    ))}
                </div>
            </div>

<div className="absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 translate-y-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-950/90">                <span className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-600 dark:text-slate-300">
                    {isTalking ? 'Speaking' : 'Ready'}
                </span>
            </div>
        </div>
    );
};

export default AvatarSpeaker;
