// Signup page for creating a new user account.
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'user'
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await authAPI.register(formData);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.msg || 'Signup failed');
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12 relative overflow-hidden">
            <div className="absolute inset-0 neural-grid opacity-10 pointer-events-none"></div>
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-sky-500/10 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full animate-pulse [animation-delay:1.5s]"></div>

            <motion.div 
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md glass-card rounded-[3rem] p-12 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] hover-glow border-white/5 relative z-10"
            >
                <div className="mb-12 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4">Initialization Protocol</p>
                    <h2 className="text-5xl font-black tracking-tighter text-pro-gradient leading-tight">Join the Elite.</h2>
                </div>
                {error && <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 px-6 py-4 text-rose-500 text-[10px] font-black uppercase tracking-widest text-center shadow-lg">{error}</motion.div>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 ml-4">Codename</label>
                        <input
                            type="text"
                            className="w-full rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-8 py-5 outline-none transition-all focus:border-sky-500/50 focus:bg-white/10 text-black dark:text-white font-medium shadow-inner"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 ml-4">Secure Email</label>
                        <input
                            type="email"
                            className="w-full rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-8 py-5 outline-none transition-all focus:border-sky-500/50 focus:bg-white/10 text-black dark:text-white font-medium shadow-inner"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 ml-4">Security Key</label>
                        <input
                            type="password"
                            className="w-full rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-8 py-5 outline-none transition-all focus:border-sky-500/50 focus:bg-white/10 text-black dark:text-white font-medium shadow-inner"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                        />
                    </div>
                    <button type="submit" className="group relative w-full mt-4 rounded-2xl bg-sky-500 px-8 py-5 text-sm font-black text-white uppercase tracking-[0.3em] transition-all hover:bg-sky-600 shadow-[0_20px_40px_rgba(56,189,248,0.3)] active:scale-95 overflow-hidden">
                        <span className="relative z-10">Register Identity</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                </form>
                <p className="mt-12 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Already Verified? <Link to="/login" className="text-sky-400 hover:text-sky-300 transition-colors ml-1 border-b border-sky-400/30 pb-0.5">Authenticate</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Signup;
