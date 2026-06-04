// Admin dashboard for users, interviews, resumes, and analytics.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedbackAPI, authAPI, resumeAPI } from '../services/api';
import { Search, User as UserIcon, History as HistoryIcon, ArrowLeft, LayoutDashboard, TrendingUp, Users, Target, Award, Trash2, ExternalLink, Filter, FileText, PieChart as PieIcon } from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';

const Admin = () => {
    const [analytics, setAnalytics] = useState(null);
    const [globalHistory, setGlobalHistory] = useState([]);
    const [users, setUsers] = useState([]);
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [resumeSearchQuery, setResumeSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'history', 'users', 'resumes'
    const [selectedUser, setSelectedUser] = useState(null);
    const [userHistory, setUserHistory] = useState([]);
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, analyticsRes, historyRes, resumesRes] = await Promise.all([
                feedbackAPI.getAdminUsers(),
                feedbackAPI.getAnalytics(),
                feedbackAPI.getAllHistory(),
                resumeAPI.getAllHistory()
            ]);
            setUsers(usersRes.data);
            setAnalytics(analyticsRes.data);
            setGlobalHistory(historyRes.data);
            setResumes(resumesRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUserClick = async (user) => {
        setLoading(true);
        try {
            const res = await feedbackAPI.getUserHistory(user.id);
            setSelectedUser(user);
            setUserHistory(res.data);
            setActiveTab('user_detail');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteInterview = async (id, isDrillDown = false) => {
        if (!window.confirm('Are you sure you want to delete this interview record? This cannot be undone.')) return;
        try {
            await feedbackAPI.deleteInterview(id);
            if (isDrillDown) {
                setUserHistory(userHistory.filter(i => i.id !== id));
            } else {
                setGlobalHistory(globalHistory.filter(i => i.id !== id));
            }
            // Refresh analytics too
            const analyticsRes = await feedbackAPI.getAnalytics();
            setAnalytics(analyticsRes.data);
        } catch (err) {
            alert('Failed to delete interview');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('CRITICAL: Are you sure you want to delete this user and ALL their interview data? This action is permanent.')) return;
        try {
            await authAPI.deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
            // Refresh history and analytics
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete user');
        }
    };

    const handleDeleteResume = async (id) => {
        if (!window.confirm('Are you sure you want to delete this resume record?')) return;
        try {
            await resumeAPI.deleteResume(id);
            setResumes(resumes.filter(r => r.id !== id));
        } catch (err) {
            alert('Failed to delete resume');
        }
    };

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredHistory = globalHistory.filter(item => 
        item.username.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(historySearchQuery.toLowerCase())
    );

    const filteredResumes = resumes.filter(item => 
        item.username.toLowerCase().includes(resumeSearchQuery.toLowerCase()) ||
        item.filename.toLowerCase().includes(resumeSearchQuery.toLowerCase())
    );

    if (loading && !selectedUser && !analytics && users.length === 0) return (
        <div className="flex h-96 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
        </div>
    );

    return (
        <div className="py-10 animate-fadeIn space-y-12">
            <div className="mx-auto max-w-[1600px] px-6">
                {/* Elite Header */}
                <div className="glass-card rounded-[4rem] p-12 mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 blur-[120px] -z-10 rounded-full"></div>
                    <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">
                                Global Control
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-pro-gradient">Staff Command Center</h2>
                            <div className="flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Operator: {currentUser.username} (Level 1 Admin)
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 glass-panel p-2 rounded-[2.5rem]">
                            <button 
                                onClick={() => { setActiveTab('dashboard'); setSelectedUser(null); }}
                                className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all ${
                                    activeTab === 'dashboard' 
                                    ? 'bg-white text-slate-900 shadow-2xl' 
                                    : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <LayoutDashboard size={16} /> Dashboard
                            </button>
                            <button 
                                onClick={() => { setActiveTab('history'); setSelectedUser(null); }}
                                className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all ${
                                    activeTab === 'history' 
                                    ? 'bg-white text-slate-900 shadow-2xl' 
                                    : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <HistoryIcon size={16} /> Stream
                            </button>
                            <button 
                                onClick={() => { setActiveTab('users'); setSelectedUser(null); }}
                                className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all ${
                                    (activeTab === 'users' || activeTab === 'user_detail')
                                    ? 'bg-white text-slate-900 shadow-2xl' 
                                    : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Users size={16} /> Directory
                            </button>
                            <button 
                                onClick={() => { setActiveTab('resumes'); setSelectedUser(null); }}
                                className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all ${
                                    activeTab === 'resumes' 
                                    ? 'bg-white text-slate-900 shadow-2xl' 
                                    : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <FileText size={16} /> Audit
                            </button>
                        </div>
                    </div>
                </div>

                {loading && !analytics ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="h-12 w-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Dashboard View */}
                        {activeTab === 'dashboard' && analytics && (
                            <div className="space-y-12 animate-fadeInUp">
                                {/* Top Stats */}
                                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="glass-card p-10 rounded-[3rem] space-y-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Operators</p>
                                        <p className="text-4xl font-black text-white tracking-tighter">{analytics.total_users}</p>
                                    </div>
                                    <div className="glass-card p-10 rounded-[3rem] space-y-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Interviews Logged</p>
                                        <p className="text-4xl font-black text-sky-400 tracking-tighter">{analytics.total_interviews}</p>
                                    </div>
                                    <div className="glass-card p-10 rounded-[3rem] space-y-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Accuracy</p>
                                        <p className="text-4xl font-black text-emerald-400 tracking-tighter">92.4%</p>
                                    </div>
                                    <div className="glass-card p-10 rounded-[3rem] space-y-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resumes Audited</p>
                                        <p className="text-4xl font-black text-amber-400 tracking-tighter">{analytics.total_resumes}</p>
                                    </div>
                                </div>

                                {/* Main Analytics Grid */}
                                <div className="grid gap-12 lg:grid-cols-2">
                                    <div className="glass-card p-12 rounded-[4rem]">
                                        <h3 className="text-xl font-black text-white mb-10 flex items-center gap-3">
                                            <TrendingUp size={20} className="text-sky-500" /> Infrastructure Growth
                                        </h3>
                                        <div className="h-[400px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={analytics.daily_users}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis dataKey="date" hide />
                                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                                    <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '1rem', color: '#fff' }} />
                                                    <Line name="Signups" type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={6} dot={false} />
                                                    <Line name="Resumes" data={analytics.daily_resumes} type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={6} dot={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="glass-card p-12 rounded-[4rem]">
                                        <h3 className="text-xl font-black text-white mb-10 flex items-center gap-3">
                                            <Target size={20} className="text-indigo-500" /> Sector Dominance
                                        </h3>
                                        <div className="h-[400px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={analytics.subject_stats}>
                                                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                                    <YAxis axisLine={false} tickLine={false} />
                                                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '1rem' }} />
                                                    <Bar dataKey="count" fill="#6366f1" radius={[12, 12, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Leaderboard and Categories */}
                        <div className="grid gap-8 lg:grid-cols-[1fr_0.6fr]">
                            <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <h3 className="text-xl font-black text-slate-900 dark:text-sky-50 mb-8 flex items-center gap-2">
                                    <Award size={20} className="text-amber-500" /> Platform Elite (Top Scores)
                                </h3>
                                <div className="space-y-4">
                                    {analytics.top_performers.map((user, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 group">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-white ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-700' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-sky-50">{user.username}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.subject.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                            <p className="text-xl font-black text-slate-900 dark:text-sky-50">{user.score}%</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <h3 className="text-xl font-black text-slate-900 dark:text-sky-50 mb-8">Performance Mix</h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={analytics.performance_overview} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                                {analytics.performance_overview.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Global History Tab */}
                {activeTab === 'history' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-sky-50">Global Session Audit</h3>
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input 
                                    type="text"
                                    placeholder="Search user or subject..."
                                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-sky-500 outline-none transition-all text-black dark:text-white"
                                    value={historySearchQuery}
                                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 dark:bg-slate-800">
                                        <th className="p-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest">User</th>
                                        <th className="p-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest">Topic</th>
                                        <th className="p-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest">Timestamp</th>
                                        <th className="p-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest">Status</th>
                                        <th className="p-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition group">
                                            <td className="p-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-sky-50 font-bold">{item.username}</td>
                                            <td className="p-4 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">{item.subject?.replace('_', ' ')}</td>
                                            <td className="p-4 border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">{new Date(item.created_at).toLocaleString()}</td>
                                            <td className="p-4 border border-slate-200 dark:border-slate-700">
                                                {item.has_feedback ? (
                                                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] font-black uppercase">Processed</span>
                                                ) : (
                                                    <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500 text-[9px] font-black uppercase">Orphaned</span>
                                                )}
                                            </td>
                                            <td className="p-4 border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => navigate(`/feedback/${item.id}`)} className="p-2 rounded-lg bg-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-white transition-colors" title="View Transcript">
                                                        <ExternalLink size={16} />
                                                    </button>
                                                    <button onClick={() => handleDeleteInterview(item.id)} className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors" title="Delete Log">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Resume Audit Tab */}
                {activeTab === 'resumes' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-sky-50">Global Resume Analysis Audit</h3>
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input 
                                    type="text"
                                    placeholder="Search user or filename..."
                                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-sky-500 outline-none transition-all text-black dark:text-white"
                                    value={resumeSearchQuery}
                                    onChange={(e) => setResumeSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 dark:bg-slate-800">
                                        <th className="p-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest">User</th>
                                        <th className="p-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest">Filename</th>
                                        <th className="p-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest">ATS Score</th>
                                        <th className="p-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest">Timestamp</th>
                                        <th className="p-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResumes.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition group">
                                            <td className="p-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-sky-50 font-bold">{item.username}</td>
                                            <td className="p-4 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium text-xs truncate max-w-xs">{item.filename}</td>
                                            <td className="p-4 border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div className={`h-full ${item.ats_score >= 70 ? 'bg-emerald-500' : item.ats_score >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${item.ats_score}%` }}></div>
                                                    </div>
                                                    <span className={`text-[10px] font-black ${item.ats_score >= 70 ? 'text-emerald-500' : item.ats_score >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>{item.ats_score}%</span>
                                                </div>
                                            </td>
                                            <td className="p-4 border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">{new Date(item.created_at).toLocaleString()}</td>
                                            <td className="p-4 border border-slate-200 dark:border-slate-700">
                                                <button onClick={() => handleDeleteResume(item.id)} className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors" title="Delete Resume Record">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* User Directory Tab */}
                {activeTab === 'users' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-sky-50">Authorized Personnel & Users</h3>
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input 
                                    type="text"
                                    placeholder="Find user..."
                                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-sky-500 outline-none transition-all text-black dark:text-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredUsers.map((user) => (
                                <div key={user.id} className="relative group">
                                    <button
                                        onClick={() => handleUserClick(user)}
                                        className="w-full flex items-center gap-4 p-6 rounded-3xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-all text-left"
                                    >
                                        <div className="h-14 w-14 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                                            <UserIcon size={24} />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <h4 className="font-bold text-slate-900 dark:text-sky-50 truncate">{user.username}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{user.interview_count} Records</span>
                                                {user.role === 'admin' && <span className="text-[9px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">Staff</span>}
                                            </div>
                                        </div>
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id); }}
                                        className="absolute top-4 right-4 p-2 rounded-xl bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all"
                                        title="Delete User"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* User Detail View */}
                {activeTab === 'user_detail' && selectedUser && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveTab('users')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors dark:text-sky-50">
                                    <ArrowLeft size={24} />
                                </button>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-sky-50">Audit: {selectedUser.username}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{selectedUser.email}</p>
                                </div>
                            </div>
                            <button onClick={() => handleDeleteUser(selectedUser.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-colors">
                                <Trash2 size={14} /> Delete Account
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 dark:bg-slate-800">
                                        <th className="p-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest">Session ID</th>
                                        <th className="p-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest">Topic</th>
                                        <th className="p-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest">Performance</th>
                                        <th className="p-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userHistory.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition">
                                            <td className="p-4 border border-slate-200 dark:border-slate-700 text-slate-400 font-mono text-[10px]">{item.id}</td>
                                            <td className="p-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">{item.subject?.replace('_', ' ')}</td>
                                            <td className="p-4 border border-slate-200 dark:border-slate-700">
                                                {item.has_feedback ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-24 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500" style={{ width: `${item.score || 0}%` }}></div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-emerald-500">{item.score || 0}%</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">No Data</span>
                                                )}
                                            </td>
                                            <td className="p-4 border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => navigate(`/feedback/${item.id}`)} className="text-sky-500 hover:underline font-black text-[10px] uppercase">Audit Report</button>
                                                    <span className="text-slate-300">|</span>
                                                    <button onClick={() => handleDeleteInterview(item.id, true)} className="text-rose-500 hover:underline font-black text-[10px] uppercase">Wipe Log</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
