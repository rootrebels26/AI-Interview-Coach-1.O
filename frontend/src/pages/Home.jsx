// Landing page that introduces the interview coach and routes users into the app.
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { feedbackAPI } from '../services/api';
import { Award } from 'lucide-react';

import AnimatedRobot from '../components/AnimatedRobot';

const trustedCompanies = [
    { name: 'Google', logo: 'https://cdn.simpleicons.org/google'},
    { name: 'Amazon', logoType: 'amazon' },
    { name: 'Meta', logo: 'https://cdn.simpleicons.org/meta' },
    { name: 'Microsoft', logoType: 'microsoft' },
    { name: 'Netflix', logo: 'https://cdn.simpleicons.org/netflix' },
    { name: 'Apple', logo: 'https://cdn.simpleicons.org/apple/111827' },
    { name: 'NVIDIA', logo: 'https://cdn.simpleicons.org/nvidia' },
];

const CompanyLogo = ({ company, size = 'small' }) => {
    const chipClass = size === 'large'
        ? 'grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white shadow-sm'
        : 'grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white shadow-sm';
    const imageClass = size === 'large' ? 'h-6 w-6 object-contain' : 'h-5 w-5 object-contain';

    if (company.logoType === 'microsoft') {
        return (
            <span className={chipClass}>
                <span className="grid h-5 w-5 grid-cols-2 gap-0.5">
                    <span className="bg-[#f25022]"></span>
                    <span className="bg-[#7fba00]"></span>
                    <span className="bg-[#00a4ef]"></span>
                    <span className="bg-[#ffb900]"></span>
                </span>
            </span>
        );
    }

    if (company.logoType === 'amazon') {
        return (
            <span className={chipClass}>
                <svg viewBox="0 0 44 44" aria-label="Amazon logo" className={imageClass}>
                    <text x="4" y="23" fill="#111827" fontSize="14" fontWeight="800" fontFamily="Arial, sans-serif">a</text>
                    <path d="M12 29c6 4 15 4 22-1" fill="none" stroke="#ff9900" strokeWidth="3" strokeLinecap="round" />
                    <path d="M31 26l5 1-3 4" fill="none" stroke="#ff9900" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
        );
    }

    return (
        <span className={chipClass}>
            <img
                src={company.logo}
                alt={`${company.name} logo`}
                className={imageClass}
                loading="lazy"
            />
        </span>
    );
};

const Home = () => {
    const [stats, setStats] = useState(null);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (token && user.role === 'admin') {
            navigate('/admin');
            return;
        }

        const fetchStats = async () => {
            try {
                const res = await feedbackAPI.getPublicStats();
                setStats(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, [navigate, token, user.role]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-start overflow-x-hidden bg-gradient-mesh relative">
            <div className="grain-overlay"></div>
            
            {/* Industry-Ready Hero Section */}
            <div className="w-full max-w-7xl px-8 relative z-10 flex flex-col md:flex-row items-center justify-between pt-10 pb-10 gap-16">
                
                {/* Left Side: Content */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 text-center md:text-left space-y-6"
                >
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-400/30 bg-sky-400/10 text-[9px] font-black uppercase tracking-[0.3em] text-sky-500 dark:text-sky-300 shadow-sm mb-4">
                            AI Powered Intelligence
                        </div>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.85] text-pro-gradient uppercase drop-shadow-2xl">
                            AI INTERVIEW COACH
                        </h1>
                        <h2 className="text-2xl md:text-4xl font-black text-slate-700 dark:text-sky-100 tracking-tighter uppercase opacity-90">
                            MAKE YOUR INTERVIEW EASY
                        </h2>
                        <p className="text-[9px] font-black text-slate-500 dark:text-sky-500/50 uppercase tracking-[0.4em]">
                            . powered by root rebels ai team
                        </p>
                    </div>
                    
                    <p className="text-sm md:text-lg font-bold text-slate-600 dark:text-slate-400 max-w-xl mx-auto md:mx-0 leading-relaxed tracking-tight opacity-80">
                        The definitive standard for elite technical talent. Experience AI-driven interview mastery that feels like the future.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                        <Link 
                            to="/subject-selection" 
                            className="bg-sky-500 text-white px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-sky-500/30 uppercase tracking-[0.1em] flex items-center justify-center gap-3 group"
                        >
                            Start Mock Interview 
                            <Award size={22} className="group-hover:rotate-12 transition-transform" />
                        </Link>

                        <Link 
                            to="/resume"
                            className="border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 backdrop-blur-3xl px-8 py-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-black text-lg text-slate-900 dark:text-white uppercase tracking-[0.1em] shadow-xl"
                        >
                            Scan Identity
                        </Link>
                    </div>
                </motion.div>

                {/* Right Side: Robot Chamber */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8, x: 30 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    className="flex-1 relative group"
                >
                    <div className="absolute -inset-20 bg-gradient-to-tr from-sky-500/20 via-indigo-500/10 to-transparent rounded-full blur-[80px] opacity-40 group-hover:opacity-70 transition duration-1000 animate-pulse"></div>
                    <div className="relative rounded-[4rem] border border-slate-200 dark:border-white/10 bg-white/[0.03] backdrop-blur-[60px] p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col items-center justify-center min-h-[450px] hover-glow transition-all duration-700">
                        <AnimatedRobot />
                    </div>
                </motion.div>
            </div>

            {/* Compact Stats Grid */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-7xl px-8 py-8 border-t border-slate-200 dark:border-white/5">
                {[ 
                    ["50K+", "Interviews Practiced", "text-sky-500"], 
                    ["95%", "Confidence Boost", "text-indigo-500"], 
                    ["24/7", "AI Availability", "text-emerald-500"], 
                    ["Top MNC", "Interview Patterns", "text-amber-500"], 
                ].map(([num, label, color]) => ( 
                    <motion.div 
                        key={label}
                        whileHover={{ y: -3 }}
                        className="glass-card rounded-[2rem] p-6 text-center border-slate-200 dark:border-white/10 hover-glow"
                    > 
                        <h2 className={`text-3xl font-black ${color} tracking-tighter`}>{num}</h2> 
                        <p className="text-slate-500 dark:text-gray-400 mt-1 font-black uppercase text-[8px] tracking-[0.2em]">{label}</p> 
                    </motion.div> 
                ))} 
            </section>

            {/* Trusted By */}
            <div className="w-full overflow-hidden border-y border-slate-200 dark:border-white/5 py-4 bg-white/70 dark:bg-slate-950/30 backdrop-blur-xl">
                <div className="marquee-track flex w-max items-center">
                    {[...trustedCompanies, ...trustedCompanies, ...trustedCompanies].map((company, i) => (
                        <div key={`${company.name}-${i}`} className="marquee-logo mx-3 flex h-14 min-w-[190px] items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                            <CompanyLogo company={company} size="large" />
                            <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">
                                {company.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Feature Showcase */}
            <section className="w-full relative overflow-hidden border-b border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-slate-950/20">
                <div className="absolute inset-0 feature-grid opacity-70"></div>
                <div className="relative max-w-7xl mx-auto px-8 py-20 md:py-24 grid gap-12 md:grid-cols-2 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.35 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-6 text-center md:text-left"
                    >
                        <div className="inline-flex items-center px-3 py-1 rounded-full border border-sky-400/30 bg-sky-400/10 text-[9px] font-black uppercase tracking-[0.3em] text-sky-600 dark:text-sky-300">
                            Site Features
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] text-slate-950 dark:text-white uppercase">
                                Practice smarter before the real interview.
                            </h2>
                            <p className="max-w-xl mx-auto md:mx-0 text-sm md:text-lg font-bold leading-relaxed text-slate-600 dark:text-slate-400">
                                Choose your subject, answer realistic AI questions, upload your resume, and review clear feedback so every session turns into measurable interview confidence.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 max-w-xl mx-auto md:mx-0">
                            {[
                                'AI mock interview sessions',
                                'Resume scanning and insights',
                                'Performance feedback reports',
                                'History tracking for progress',
                            ].map((feature) => (
                                <div key={feature} className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, x: 24 }}
                        whileInView={{ opacity: 1, scale: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.35 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="relative min-h-[420px] md:min-h-[520px] flex items-center justify-center"
                    >
                        <div className="absolute h-72 w-72 md:h-[430px] md:w-[430px] rounded-[34%] border border-sky-400/20 bg-sky-400/10 blur-3xl"></div>
                        <div className="absolute h-72 w-72 md:h-[420px] md:w-[420px] rounded-[30%] border border-slate-300/30 dark:border-white/10 rotate-12"></div>
                        <div className="absolute h-64 w-64 md:h-[390px] md:w-[390px] rounded-[30%] border border-sky-300/20 border-dashed -rotate-12"></div>

                        <motion.div
                            animate={{ y: [0, -14, 0], rotate: [-7, -4, -7] }}
                            transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute top-8 right-0 z-20 w-[86%] max-w-[520px] overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-slate-900"
                        >
                            <img
                                src="/image1.png"
                                alt="Resume scanner feature preview"
                                className="h-full w-full object-cover"
                            />
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 16, 0], rotate: [10, 7, 10] }}
                            transition={{ duration: 6.4, repeat: Infinity, ease: 'easeInOut', delay: 0.35 }}
                            className="absolute bottom-4 left-0 z-10 w-[88%] max-w-[560px] overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_36px_90px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-slate-900"
                        >
                            <img
                                src="/image2.png"
                                alt="AI interview console feature preview"
                                className="h-full w-full object-cover"
                            />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Elite Footer */}
            <footer className="w-full mt-20 border-t border-sky-400/20 bg-slate-950 text-slate-100 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/70 to-transparent"></div>
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-sky-400/10 to-transparent"></div>
                
                <div className="relative max-w-7xl mx-auto px-6 sm:px-10 py-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-5">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="Logo" className="h-11 w-11 rounded-xl object-cover shadow-2xl shadow-sky-950/50" />
                            <span className="text-xl font-black tracking-tighter text-white">ROOT REBELS</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-400 leading-relaxed tracking-tight max-w-xs">
                            The definitive standard in technical interview mastery. Engineered for excellence.
                        </p>
                    </div>
                    
                    {[
                        { title: "Operations", links: ["Subject Mastery", "ATS Auditing", "Session History", "Elite Coaching"] },
                        { title: "Organization", links: ["About Us", "Our Legacy", "Intelligence Unit", "Careers", "Press Kit"] },
                        { title: "Network", links: ["Twitter / X", "LinkedIn", "Discord", "Neural Link"] }
                    ].map((section, i) => (
                        <div key={i} className="space-y-4">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-300">{section.title}</h5>
                            <ul className="space-y-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                                {section.links.map((link, j) => (
                                    <li key={j}>
                                        {link === "About Us" ? (
                                            <Link to="/about-us" className="hover:text-white transition-colors duration-300">{link}</Link>
                                        ) : (
                                            <a href="#" className="hover:text-white transition-colors duration-300">{link}</a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                
                <div className="relative border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-7 flex flex-col md:flex-row justify-between items-center gap-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500 text-center md:text-left">(C) 2024 ROOT REBELS AI. SECURED BY NEURAL ENCRYPTION.</p>
                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                            <a href="#" className="hover:text-sky-300 transition-all">Privacy Protocol</a>
                            <a href="#" className="hover:text-sky-300 transition-all">Service Terms</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
