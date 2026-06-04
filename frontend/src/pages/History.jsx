// User history page for reviewing previous interview sessions.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedbackAPI } from '../services/api';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await feedbackAPI.getHistory();
                setHistory(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="mx-auto mt-10 max-w-5xl px-4 pb-20">
            <div className="rounded-[3rem] border-2 border-slate-200 bg-slate-50/95 p-10 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900/90 dark:border-slate-800 dark:ring-slate-800 transition-all duration-300">
                <div className="mb-12 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                        Interview Archive
                    </div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-sky-50 sm:text-5xl">
                        Your <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Journey</span> so far
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                        Review your past performances, track your progress, and see how much you've improved.
                    </p>
                </div>

                <div className="grid gap-6">
                    {history.map((item) => (
                        <div 
                            key={item.id}
                            className="group relative rounded-3xl border-2 border-slate-200 bg-slate-100 p-6 transition-all hover:border-emerald-400 hover:shadow-xl dark:bg-slate-800/50 dark:border-slate-800 dark:hover:border-emerald-500/50"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🎯</span>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-sky-50">
                                            {item.subject ? item.subject.replace('_', ' ').toUpperCase() : 'General Interview'}
                                        </h3>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(item.created_at).toLocaleDateString(undefined, { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    {item.has_feedback ? (
                                        <button
                                            onClick={() => navigate(`/feedback/${item.id}`)}
                                            className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-sky-50 transition hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                                        >
                                            View Analysis
                                        </button>
                                    ) : (
                                        <span className="text-sm font-bold text-slate-400 dark:text-slate-500 italic">
                                            Feedback pending
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {history.length === 0 && (
                        <div className="text-center py-20 bg-slate-100 dark:bg-slate-800/30 rounded-[2.5rem] border-2 border-dashed border-slate-300 dark:border-slate-700">
                            <p className="text-xl font-bold text-slate-500 dark:text-slate-500">No interviews found yet.</p>
                            <button 
                                onClick={() => navigate('/subject-selection')}
                                className="mt-6 text-emerald-500 font-bold hover:underline"
                            >
                                Start your first interview
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default History;
