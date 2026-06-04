// Resume analysis page for uploading a resume and viewing ATS feedback.
import { useState } from 'react';
import { resumeAPI } from '../services/api';

const Resume = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setResult(null);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await resumeAPI.analyze(formData);
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto mt-10 max-w-6xl px-4 pb-20">
            <div className="rounded-[3rem] border-2 border-slate-200 bg-slate-50/95 p-10 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900/90 dark:border-slate-800 dark:ring-slate-800 transition-all duration-300">
                <div className="mb-12 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-500 dark:bg-indigo-400/10 dark:text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                        ATS-Optimization Engine
                    </div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-sky-50 sm:text-5xl">
                        Optimize your resume for <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">success</span>
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                        Upload your resume and receive an instant ATS score, expert recommendations, and tailored improvement tips.
                    </p>
                </div>

                <form onSubmit={handleUpload} className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-start">
                    <div className="relative group rounded-[2.5rem] border-2 border-dashed border-slate-300 bg-slate-100 p-12 text-center dark:bg-slate-800/30 dark:border-slate-700 transition-all hover:border-indigo-400 dark:hover:border-indigo-500">
                        <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">📄</div>
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Drag and drop your resume</p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">Supports PDF and DOCX formats</p>
                        <input
                            type="file"
                            accept=".pdf,.docx"
                            onChange={handleFileChange}
                            className="mt-8 w-full cursor-pointer rounded-2xl border-2 border-slate-200 bg-slate-50 px-6 py-4 text-black dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                    
                    <div className="space-y-6">
                        <button
                            type="submit"
                            disabled={!file || loading}
                            className="w-full rounded-[1.5rem] bg-slate-900 py-5 text-xl font-bold text-sky-50 shadow-2xl transition-all hover:bg-slate-800 hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-50 border-t-transparent"></div>
                                    Analyzing...
                                </>
                            ) : 'Analyze Resume Now'}
                        </button>
                        
                        <div className="rounded-[2rem] border-2 border-slate-200 bg-slate-100 p-8 dark:bg-slate-800/50 dark:border-slate-800 shadow-xl">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-sky-50 mb-6 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                                Pro Optimization Tips
                            </h3>
                            <ul className="space-y-4 text-slate-600 dark:text-slate-400">
                                <li className="flex gap-3">
                                    <span className="text-indigo-500 font-bold">01.</span>
                                    <span>Use standard section headings like "Work Experience" and "Education".</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-indigo-500 font-bold">02.</span>
                                    <span>Quantify your achievements with numbers and percentages.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-indigo-500 font-bold">03.</span>
                                    <span>Keep the layout simple—avoid complex graphics or multi-column designs.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </form>

                {error && (
                    <div className="mt-8 rounded-2xl bg-rose-50 border-2 border-rose-100 px-6 py-4 text-center text-rose-700 dark:bg-rose-900/20 dark:border-rose-900/30 dark:text-rose-400 font-semibold animate-shake">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="mt-16 space-y-10 animate-fade-in">
                        <div className="rounded-[2.5rem] border-2 border-slate-200 bg-slate-100 p-10 shadow-xl dark:bg-slate-800/50 dark:border-slate-800">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                                <div className="text-center sm:text-left">
                                    <p className="text-sm uppercase tracking-widest text-slate-500 dark:text-slate-500 font-bold mb-2">Overall ATS Score</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-7xl font-black text-slate-900 dark:text-sky-50">{result.score}</span>
                                        <span className="text-2xl font-bold text-slate-500 dark:text-slate-500">/ 100</span>
                                    </div>
                                </div>
                                <div className="relative h-40 w-40 flex items-center justify-center">
                                    <svg className="h-full w-full transform -rotate-90">
                                        <circle cx="80" cy="80" r="70" className="stroke-slate-200 dark:stroke-slate-700 fill-none" strokeWidth="12" />
                                        <circle cx="80" cy="80" r="70" className="stroke-indigo-500 fill-none transition-all duration-1000" strokeWidth="12" strokeLinecap="round" strokeDasharray="440" strokeDashoffset={440 - (440 * result.score) / 100} />
                                    </svg>
                                    <span className="absolute text-3xl font-black text-indigo-500">{result.score}%</span>
                                </div>
                            </div>
                            
                            <div className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-10">
                                <h4 className="text-2xl font-bold text-slate-900 dark:text-sky-50 mb-6">Detailed Analysis</h4>
                                <div className="grid gap-6">
                                    {result.feedback && result.feedback.length > 0 ? (
                                        result.feedback.map((item, index) => (
                                            <div key={index} className="flex gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-sm">
                                                <div className="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0 mt-1">
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{item}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">{result.analysis}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Resume;
