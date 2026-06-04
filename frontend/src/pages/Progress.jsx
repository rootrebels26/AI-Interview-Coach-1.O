// Student progress dashboard with live charts and improvement suggestions.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, BookOpen, Brain, LineChart as LineIcon, Target, TrendingUp } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { feedbackAPI } from '../services/api';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'];

const statCards = [
    { key: 'total_interviews', label: 'Interviews', icon: Brain, tone: 'text-sky-500' },
    { key: 'average_score', label: 'Avg Score', icon: Award, tone: 'text-emerald-500', suffix: '%' },
    { key: 'improvement', label: 'Growth', icon: TrendingUp, tone: 'text-violet-500', suffix: '%' },
    { key: 'latest_resume_score', label: 'Resume ATS', icon: Target, tone: 'text-amber-500', suffix: '%' },
];

const EmptyChartState = ({ title, message, actionLabel, onAction }) => (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950/40">
        <BookOpen className="mb-4 text-sky-500" size={36} />
        <h4 className="text-lg font-black text-slate-950 dark:text-white">{title}</h4>
        <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">{message}</p>
        {actionLabel && (
            <button
                onClick={onAction}
                className="mt-6 rounded-2xl bg-sky-500 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg hover:bg-sky-600"
            >
                {actionLabel}
            </button>
        )}
    </div>
);

const Progress = () => {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const navigate = useNavigate();

    const fetchProgress = async () => {
        try {
            const res = await feedbackAPI.getProgress();
            setProgress(res.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProgress();
        const intervalId = window.setInterval(fetchProgress, 15000);
        return () => window.clearInterval(intervalId);
    }, []);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
            </div>
        );
    }

    const summary = progress?.summary || {};
    const scoreTrend = progress?.score_trend || [];
    const categoryScores = progress?.category_scores || [];
    const subjectBreakdown = progress?.subject_breakdown || [];
    const resumeTrend = progress?.resume_trend || [];
    const suggestions = progress?.suggestions || [];
    const hasProgress = scoreTrend.length > 0;

    return (
        <div className="mx-auto max-w-[1500px] px-6 py-10 animate-fadeIn space-y-10">
            <section className="glass-card rounded-[3rem] p-8 md:p-12 overflow-hidden relative">
                <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl"></div>
                <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-sky-500">
                            Live Learning Dashboard
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-pro-gradient">
                            Your Progress
                        </h2>
                        <p className="max-w-2xl text-sm md:text-base font-medium leading-7 text-slate-600 dark:text-slate-400">
                            Track interview scores, category strength, resume growth, and practical suggestions for what to study next.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/70 px-5 py-3 text-xs font-bold text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                        Auto-refresh: 15s
                        {lastUpdated && <span className="ml-2 text-sky-500">Updated {lastUpdated.toLocaleTimeString()}</span>}
                    </div>
                </div>
            </section>

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map(({ key, label, icon: Icon, tone, suffix }) => {
                    const value = summary[key];
                    const displayValue = value === null || value === undefined ? 'N/A' : `${value}${suffix || ''}`;
                    return (
                        <div key={key} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
                            <div className="mb-5 flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">{label}</p>
                                <Icon className={tone} size={22} />
                            </div>
                            <p className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">{displayValue}</p>
                        </div>
                    );
                })}
            </section>

            {!hasProgress && subjectBreakdown.length === 0 && (
                <section className="rounded-[3rem] border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/60">
                    <BookOpen className="mx-auto mb-5 text-sky-500" size={42} />
                    <h3 className="text-2xl font-black text-slate-950 dark:text-white">No scored interviews yet</h3>
                    <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-400">
                        Complete an interview and generate feedback. Your graphs and suggestions will appear here automatically.
                    </p>
                    <button
                        onClick={() => navigate('/subject-selection')}
                        className="mt-8 rounded-2xl bg-sky-500 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg hover:bg-sky-600"
                    >
                        Start Interview
                    </button>
                </section>
            )}

            <section className="grid gap-8 xl:grid-cols-[1.4fr_0.9fr]">
                <div className="rounded-[3rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <h3 className="mb-8 flex items-center gap-3 text-xl font-black text-slate-950 dark:text-white">
                        <LineIcon className="text-sky-500" size={22} /> Interview Score Trend
                    </h3>
                    <div className="h-[360px]">
                        {scoreTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={scoreTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', background: '#0f172a', color: '#fff' }} />
                                    <Line type="monotone" dataKey="overall" stroke="#0ea5e9" strokeWidth={4} dot={{ r: 5 }} name="Overall" />
                                    <Line type="monotone" dataKey="technical" stroke="#8b5cf6" strokeWidth={3} dot={false} name="Technical" />
                                    <Line type="monotone" dataKey="communication" stroke="#10b981" strokeWidth={3} dot={false} name="Communication" />
                                    <Line type="monotone" dataKey="confidence" stroke="#f59e0b" strokeWidth={3} dot={false} name="Confidence" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChartState
                                title="No score trend yet"
                                message="Save an interview and generate feedback. Once feedback exists, your score line will appear here."
                                actionLabel="Start Interview"
                                onAction={() => navigate('/subject-selection')}
                            />
                        )}
                    </div>
                </div>

                <div className="rounded-[3rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <h3 className="mb-8 flex items-center gap-3 text-xl font-black text-slate-950 dark:text-white">
                        <Target className="text-emerald-500" size={22} /> Skill Balance
                    </h3>
                    <div className="h-[360px]">
                        {categoryScores.some((item) => item.score > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryScores}>
                                    <XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: 'rgba(14,165,233,0.08)' }} />
                                    <Bar dataKey="score" radius={[12, 12, 0, 0]}>
                                        {categoryScores.map((entry, index) => (
                                            <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChartState
                                title="No skill scores yet"
                                message="This chart needs generated feedback scores for communication, technical skill, and confidence."
                                actionLabel="View History"
                                onAction={() => navigate('/history')}
                            />
                        )}
                    </div>
                </div>
            </section>

            <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[3rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <h3 className="mb-8 text-xl font-black text-slate-950 dark:text-white">Topic Practice Mix</h3>
                    <div className="h-[320px]">
                        {subjectBreakdown.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={subjectBreakdown} dataKey="count" nameKey="subject" outerRadius={110} label>
                                        {subjectBreakdown.map((entry, index) => (
                                            <Cell key={entry.subject} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChartState
                                title="No topics practiced yet"
                                message="Your topic mix appears after you save interviews across technical, frontend, backend, behavioral, or other subjects."
                                actionLabel="Pick Subject"
                                onAction={() => navigate('/subject-selection')}
                            />
                        )}
                    </div>
                </div>

                <div className="rounded-[3rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <h3 className="mb-8 text-xl font-black text-slate-950 dark:text-white">Suggestions To Improve</h3>
                    <div className="space-y-4">
                        {suggestions.map((suggestion, index) => (
                            <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-500">Step {index + 1}</p>
                                <p className="mt-2 font-semibold leading-7 text-slate-700 dark:text-slate-200">{suggestion}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {resumeTrend.length > 0 && (
                <section className="rounded-[3rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <h3 className="mb-8 text-xl font-black text-slate-950 dark:text-white">Resume ATS Progress</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={resumeTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', background: '#0f172a', color: '#fff' }} />
                                <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={4} dot={{ r: 5 }} name="ATS Score" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Progress;
