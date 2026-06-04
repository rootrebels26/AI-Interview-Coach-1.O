// Animated robot visual used by the home page experience.
const AnimatedBot = () => {
    return (
        <div className="flex h-[28rem] w-full items-center justify-center overflow-visible">
            <style>{`
                @keyframes botFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-14px); }
                }

                @keyframes botWave {
                    0%, 100% { transform: rotate(-10deg); }
                    50% { transform: rotate(18deg); }
                }

                @keyframes botBlink {
                    0%, 88%, 100% { transform: scaleY(1); opacity: 1; }
                    92% { transform: scaleY(0.18); opacity: 0.85; }
                }

                @keyframes botGlow {
                    0%, 100% { opacity: 0.9; }
                    50% { opacity: 1; }
                }

                .home-bot {
                    animation: botFloat 4s ease-in-out infinite;
                    filter: drop-shadow(0 28px 28px rgba(15, 23, 42, 0.16));
                    max-width: min(420px, 92vw);
                }

                .home-bot-eye,
                .home-bot-smile {
                    animation: botBlink 4.8s ease-in-out infinite;
                    transform-box: fill-box;
                    transform-origin: center;
                }

                .home-bot-face-glow {
                    animation: botGlow 2.8s ease-in-out infinite;
                }

                .home-bot-wave {
                    animation: botWave 1.35s ease-in-out infinite;
                    transform-box: fill-box;
                    transform-origin: 22% 80%;
                }
            `}</style>

            <svg
                className="home-bot"
                viewBox="0 0 520 540"
                role="img"
                aria-label="Friendly AI interview coach bot waving"
            >
                <defs>
                    <radialGradient id="headGlow" cx="36%" cy="18%" r="84%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="46%" stopColor="#e8f4ff" />
                        <stop offset="100%" stopColor="#b8d7f7" />
                    </radialGradient>
                    <linearGradient id="bodyShell" x1="0%" x2="100%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#f8fbff" />
                        <stop offset="58%" stopColor="#d9ebff" />
                        <stop offset="100%" stopColor="#a9c9ed" />
                    </linearGradient>
                    <linearGradient id="screen" x1="0%" x2="100%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#111827" />
                        <stop offset="46%" stopColor="#020617" />
                        <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <linearGradient id="darkPart" x1="0%" x2="100%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#334155" />
                        <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <filter id="blueGlow" x="-80%" y="-80%" width="260%" height="260%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#1e293b" floodOpacity="0.18" />
                    </filter>
                </defs>

                <ellipse cx="260" cy="498" rx="120" ry="15" fill="#bfdbfe" opacity="0.46" />

                <g filter="url(#softShadow)">
                    <path
                        d="M237 353h104c34 0 57 30 44 62l-14 34c-14 34-44 56-78 56h-8c-36 0-70-22-86-56l-17-36c-15-31 8-60 55-60Z"
                        fill="url(#bodyShell)"
                    />
                    <rect x="169" y="309" width="190" height="96" rx="32" fill="url(#bodyShell)" />
                    <path d="M178 369h171" stroke="#bfd8f3" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
                </g>

                <path d="M155 377c-45 11-57 55-55 104" stroke="url(#darkPart)" strokeWidth="16" strokeLinecap="round" fill="none" />
                <rect x="86" y="435" width="41" height="73" rx="19" fill="url(#bodyShell)" transform="rotate(-5 106.5 471.5)" />
                <rect x="93" y="499" width="34" height="22" rx="8" fill="url(#darkPart)" />
                <rect x="100" y="499" width="6" height="26" rx="3" fill="#020617" />
                <rect x="115" y="499" width="6" height="26" rx="3" fill="#020617" />

                <path d="M359 376c30-4 45-24 65-58" stroke="url(#darkPart)" strokeWidth="16" strokeLinecap="round" fill="none" />
                <g className="home-bot-wave">
                    <rect x="407" y="268" width="55" height="89" rx="27" fill="url(#bodyShell)" transform="rotate(28 434.5 312.5)" />
                    <circle cx="465" cy="258" r="25" fill="url(#bodyShell)" />
                    <rect x="462" y="224" width="12" height="37" rx="6" fill="#0f172a" transform="rotate(41 468 242.5)" />
                    <rect x="481" y="233" width="12" height="37" rx="6" fill="#0f172a" transform="rotate(41 487 251.5)" />
                    <rect x="444" y="242" width="12" height="33" rx="6" fill="#0f172a" transform="rotate(41 450 258.5)" />
                </g>

                <rect x="258" y="55" width="12" height="56" rx="6" fill="url(#darkPart)" />
                <circle cx="264" cy="46" r="24" fill="url(#darkPart)" />
                <circle cx="255" cy="37" r="8" fill="#ffffff" opacity="0.18" />

                <ellipse cx="128" cy="205" rx="29" ry="54" fill="url(#darkPart)" />
                <ellipse cx="404" cy="205" rx="29" ry="54" fill="url(#darkPart)" />

                <rect x="112" y="92" width="308" height="245" rx="98" fill="url(#headGlow)" filter="url(#softShadow)" />
                <path d="M136 131c35-30 74-44 125-45" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" opacity="0.26" />

                <rect x="168" y="147" width="198" height="125" rx="38" fill="url(#screen)" />
                <rect
                    x="179"
                    y="159"
                    width="176"
                    height="103"
                    rx="31"
                    fill="none"
                    stroke="#dbeafe"
                    strokeWidth="5"
                    opacity="0.95"
                />
                <path d="M187 171c40-15 111-20 151-10" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity="0.95" />
                <circle cx="352" cy="170" r="5" fill="#ffffff" />

                <g className="home-bot-face-glow" filter="url(#blueGlow)">
                    <rect className="home-bot-eye" x="219" y="189" width="16" height="55" rx="8" fill="#8ee7ff" />
                    <rect className="home-bot-eye" x="300" y="189" width="16" height="55" rx="8" fill="#8ee7ff" />
                    <path className="home-bot-smile" d="M254 238c10 22 31 22 42 0" stroke="#8ee7ff" strokeWidth="8" strokeLinecap="round" fill="none" />
                </g>
            </svg>
        </div>
    );
};

export default AnimatedBot;
