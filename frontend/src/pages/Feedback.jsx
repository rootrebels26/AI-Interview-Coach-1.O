// Feedback results page that generates and displays interview evaluation.
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { feedbackAPI } from '../services/api';
import { Star, MessageSquare, Lightbulb, Target, TrendingUp, ChevronRight } from 'lucide-react';

const Feedback = () => {
    const { id } = useParams();
    const [data, setData] = useState({ feedback: null, conversation: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const res = await feedbackAPI.generate(id);
                let conversation = res.data.conversation;
                if (typeof conversation === 'string') {
                    try { conversation = JSON.parse(conversation); } catch (e) { conversation = []; }
                }

                let feedback = res.data.feedback;
                // Try to parse feedback as JSON if it's a string
                if (typeof feedback === 'string') {
                    try {
                        feedback = JSON.parse(feedback);
                    } catch (e) {
                        // Keep as string if parsing fails (legacy support)
                    }
                }

                setData({ 
                    feedback: feedback, 
                    conversation: conversation || [],
                    subject: res.data.subject
                });
            } catch (err) {
                setError('Failed to load feedback');
            } finally {
                setLoading(false);
            }
        };
        fetchFeedback();
    }, [id]);

    const ScoreCard = ({ label, score, icon: Icon, color }) => (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
                    <Icon size={24} className={color.replace('bg-', 'text-')} />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-sky-50">{score}<span className="text-sm text-slate-400">/10</span></p>
                </div>
            </div>
            <div className="h-16 w-16 relative">
                <svg className="h-full w-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="6" />
                    <circle cx="32" cy="32" r="28" className={`fill-none transition-all duration-1000 ${color.replace('bg-', 'stroke-')}`} strokeWidth="6" strokeLinecap="round" strokeDasharray="176" strokeDashoffset={176 - (176 * score) / 10} />
                </svg>
            </div>
        </div>
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
            <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest">Generating Analysis...</p>
        </div>
    );

    if (error) return (
        <div className="text-center py-20">
            <div className="inline-flex p-4 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 mb-4">
                <Target size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-sky-50">{error}</h2>
            <Link to="/" className="mt-6 inline-block text-sky-500 font-bold hover:underline">Return Home</Link>
        </div>
    );

    const isJsonFeedback = data.feedback && typeof data.feedback === 'object';

    return (
        <div className="mx-auto mt-10 max-w-7xl px-4 pb-20">
            <div className="rounded-[3rem] border-2 border-slate-200 bg-slate-50/95 p-10 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900/90 dark:border-slate-800 dark:ring-slate-800">
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-4 py-2 text-sm font-black text-sky-600 dark:bg-sky-400/10 dark:text-sky-400 ring-1 ring-inset ring-sky-500/20 uppercase tracking-widest mb-6">
                        Performance Insights
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-sky-50 mb-4 tracking-tight">Interview Review</h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
                        {data.subject ? `Subject: ${data.subject.replace('_', ' ').toUpperCase()}` : 'General Performance Analysis'}
                    </p>
                </div>

                {isJsonFeedback ? (
                    <div className="space-y-12 animate-fadeIn">
                        {/* Scores Grid */}
                        <div className="grid gap-6 md:grid-cols-3">
                            <ScoreCard label="Communication" score={data.feedback.scores.communication} icon={MessageSquare} color="bg-blue-500" />
                            <ScoreCard label="Technical" score={data.feedback.scores.technical} icon={TrendingUp} color="bg-indigo-500" />
                            <ScoreCard label="Confidence" score={data.feedback.scores.confidence} icon={Star} color="bg-amber-500" />
                        </div>

                        {/* Detailed Analysis */}
                        <div className="grid gap-8 lg:grid-cols-2">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-sky-50 flex items-center gap-3">
                                    <Target className="text-sky-500" /> Category-wise Details
                                </h3>
                                <div className="space-y-4">
                                    {Object.entries(data.feedback.categories).map(([cat, text]) => (
                                        <div key={cat} className="p-6 rounded-[2rem] bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <h4 className="font-black text-slate-900 dark:text-sky-50 uppercase tracking-widest text-xs mb-3 text-sky-600 dark:text-sky-400">{cat}</h4>
                                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm font-medium">{text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="p-8 rounded-[2.5rem] bg-slate-900 text-sky-50 shadow-xl dark:bg-slate-800">
                                    <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                                        <Star className="text-amber-400" /> Executive Summary
                                    </h3>
                                    <p className="text-slate-300 leading-relaxed font-medium">{data.feedback.overall}</p>
                                </div>

                                <div className="p-8 rounded-[2.5rem] border-2 border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-sm">
                                    <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-400 mb-6 flex items-center gap-3">
                                        <Lightbulb /> Roadmap to Improvement
                                    </h3>
                                    <ul className="space-y-4">
                                        {data.feedback.suggestions.map((s, i) => (
                                            <li key={i} className="flex gap-4 text-emerald-800 dark:text-emerald-300 font-medium">
                                                <ChevronRight className="flex-shrink-0 mt-1" />
                                                <span>{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Legacy Text Feedback Support */
                    <div className="space-y-8 animate-fadeIn">
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-800 shadow-sm dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-200">
                            <h3 className="text-xl font-bold mb-4">Interview Feedback</h3>
                            <div className="whitespace-pre-wrap leading-7 text-sm">{data.feedback}</div>
                        </div>
                    </div>
                )}

                {/* Interview Transcript Section */}
                <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-sky-50 mb-8 flex items-center gap-3">
                        <MessageSquare className="text-indigo-500" /> Full Interview Transcript
                    </h3>
                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                        {data.conversation.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-[2rem] px-8 py-4 shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-slate-900 text-sky-50 dark:bg-sky-600' 
                                    : 'bg-white text-slate-900 border border-slate-200 dark:bg-slate-800 dark:text-sky-50 dark:border-slate-700'
                                }`}>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-50">
                                        {msg.role === 'user' ? 'You' : 'AI Interviewer'}
                                    </p>
                                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center border-t border-slate-200 dark:border-slate-800 pt-10">
                    <Link to="/subject-selection" className="rounded-2xl bg-slate-900 px-8 py-4 text-base font-bold text-sky-50 transition hover:bg-slate-800 hover:scale-105 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                        Try Another Session
                    </Link>
                    <Link to="/" className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-8 py-4 text-base font-bold text-slate-900 transition hover:bg-slate-100 hover:scale-105 dark:bg-slate-900 dark:border-slate-800 dark:text-sky-50 dark:hover:bg-slate-800">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Feedback;
