// Subject and company selection page before starting an interview.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

const SubjectSelection = () => {
    const [selectedSubject, setSelectedSubject] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [customCompany, setCustomCompany] = useState('');
    const navigate = useNavigate();

    const subjects = [
        { id: 'technical', name: 'Software Engineer', icon: '💻', description: 'DS, Algorithms, and System Design.' },
        { id: 'frontend', name: 'Frontend Developer', icon: '🎨', description: 'React, CSS, and Web Performance.' },
        { id: 'backend', name: 'Backend Developer', icon: '⚙️', description: 'APIs, Databases, and Scalability.' },
        { id: 'behavioral', name: 'Behavioral', icon: '🤝', description: 'Leadership, Conflict, and Soft Skills.' },
        { id: 'data_science', name: 'Data Scientist', icon: '📊', description: 'ML, Statistics, and Data Analysis.' },
        { id: 'fullstack', name: 'Full Stack', icon: '🚀', description: 'End-to-end Web Development.' }
    ];
    const companies = [
    {
        name: 'Google',
        logo: 'https://cdn.simpleicons.org/google',
    },
    {
        name: 'Amazon',
        logo: null,
        logoType: 'amazon',
    },
    {
        name: 'Meta',
        logo: 'https://cdn.simpleicons.org/meta',
    },
    {
        name: 'Microsoft',
        logo: null,
        logoType: 'microsoft',
    },
    {
        name: 'Netflix',
        logo: 'https://cdn.simpleicons.org/netflix/e50914',
    },
    {
        name: 'Apple',
        logo: 'https://cdn.simpleicons.org/apple',
    },
    {
        name: 'Other',
        logo: null,
    },
];

    const handleSubjectSelect = (id) => {
        setSelectedSubject(id);
    };

    const handleStartInterview = () => {
        if (selectedSubject) {
            const finalCompany = companyName === 'Other' ? customCompany : companyName;
            localStorage.setItem('selectedSubject', selectedSubject);
            localStorage.setItem('selectedCompany', finalCompany || 'General');
            navigate('/interview');
        }
    };

    const renderCompanyLogo = (company) => {
        if (company.logoType === 'microsoft') {
            return (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white shadow-sm">
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
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white shadow-sm">
                    <svg viewBox="0 0 44 44" aria-label="Amazon logo" className="h-6 w-6">
                        <text x="4" y="23" fill="#111827" fontSize="14" fontWeight="800" fontFamily="Arial, sans-serif">a</text>
                        <path d="M12 29c6 4 15 4 22-1" fill="none" stroke="#ff9900" strokeWidth="3" strokeLinecap="round" />
                        <path d="M31 26l5 1-3 4" fill="none" stroke="#ff9900" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            );
        }

        if (company.logo) {
            return (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white shadow-sm">
                    <img
                        src={company.logo}
                        alt={`${company.name} logo`}
                        className="h-5 w-5 object-contain"
                        loading="lazy"
                    />
                </span>
            );
        }

        return <Building2 size={18} className={companyName === company.name ? 'text-white' : 'text-slate-500'} />;
    };

    return (
        <div className="py-20 animate-fadeIn">
            <div className="mx-auto max-w-6xl px-4">
                <div className="glass-card rounded-[4rem] p-16 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-[100px] -z-10 rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -z-10 rounded-full"></div>

                    <div className="mb-16 text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">
                            Elite Training
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-pro-gradient leading-tight">
                            Define Your Mission.
                        </h1>
                    </div>

                    <div className="space-y-12">
                        {/* Company Selection */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3">
                                <Building2 size={24} className="text-sky-500" /> Target Organization
                            </h3>
                            <div className="grid gap-4 md:grid-cols-4">
                                {companies.map((company, index) => (
                                    <motion.button
                                        key={company.name}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => setCompanyName(company.name)}
                                        className={`flex items-center justify-center gap-3 px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all duration-500 ${
                                            companyName === company.name 
                                            ? 'bg-sky-500 text-white shadow-[0_15px_30px_rgba(56,189,248,0.4)] scale-105' 
                                            : 'glass-panel text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-white dark:hover:bg-white/10'
                                        }`}
                                    >
                                        {renderCompanyLogo(company)}
                                        <span>{company.name}</span>
                                    </motion.button>
                                ))}
                            </div>
                            {companyName === 'Other' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4"
                                >
                                    <input 
                                        type="text"
                                        placeholder="Enter target company name..."
                                        className="w-full max-w-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-8 py-4 font-medium text-black dark:text-white outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-500"
                                        value={customCompany}
                                        onChange={(e) => setCustomCompany(e.target.value)}
                                    />
                                </motion.div>
                            )}
                        </div>

                        {/* Subject Selection */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3">
                                <Award size={24} className="text-indigo-500" /> Specialized Role
                            </h3>
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {subjects.map((subject, index) => (
                                    <motion.button
                                        key={subject.id}
                                        type="button"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => handleSubjectSelect(subject.id)}
                                        className={`group relative text-left rounded-[3rem] p-10 transition-all duration-700 overflow-hidden ${
                                            selectedSubject === subject.id
                                                ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-[0_30px_60px_rgba(56,189,248,0.4)]'
                                                : 'glass-panel hover:bg-slate-50 hover:border-slate-300 hover:shadow-2xl dark:hover:bg-white/10 dark:hover:border-white/20'
                                        }`}
                                    >
                                        <div className={`flex h-20 w-20 items-center justify-center rounded-[2rem] text-4xl transition-all duration-500 ${
                                            selectedSubject === subject.id
                                                ? 'bg-white/20 scale-110 rotate-12'
                                                : 'bg-slate-100 group-hover:bg-sky-50 group-hover:scale-110 dark:bg-white/5 dark:group-hover:bg-white/10'
                                        }`}>
                                            {subject.icon}
                                        </div>
                                        <h3 className={`mt-10 text-3xl font-black tracking-tight ${selectedSubject === subject.id ? 'text-white' : 'text-slate-950 dark:text-slate-100'}`}>
                                            {subject.name}
                                        </h3>
                                        <p className={`mt-4 text-base font-medium leading-relaxed ${selectedSubject === subject.id ? 'text-sky-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {subject.description}
                                        </p>
                                        
                                        {/* Animated selection indicator */}
                                        {selectedSubject === subject.id && (
                                            <motion.div 
                                                layoutId="active-subject"
                                                className="absolute top-6 right-8 h-3 w-3 rounded-full bg-white animate-ping"
                                            />
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 flex justify-center">
                        <button
                            onClick={handleStartInterview}
                            disabled={!selectedSubject || (companyName === 'Other' && !customCompany)}
                            className={`group relative px-16 py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest transition-all duration-500 ${
                                (selectedSubject && (companyName !== 'Other' || customCompany))
                                    ? 'bg-white text-slate-900 shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95' 
                                    : 'bg-white/5 text-slate-600 cursor-not-allowed grayscale'
                            }`}
                        >
                            {selectedSubject ? (
                                <span className="flex items-center gap-4">
                                    Initiate Training <Award size={24} className="text-sky-500" />
                                </span>
                            ) : (
                                'Define Mission'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubjectSelection;
