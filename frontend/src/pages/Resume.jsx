import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, FileText, Cloud } from 'lucide-react';
import ResumeUpload from '../components/ResumeUpload';
import ResumeSummary from '../components/ResumeSummary';
import { useInterview } from '../context/InterviewContext';

export default function Resume() {
  const { resumeData, setResumeData } = useInterview();
  const [extractedData, setExtractedData] = useState(resumeData || null);
  const [uploadedFilename, setUploadedFilename] = useState('');

  const handleAnalysisComplete = (data, filename) => {
    setExtractedData(data);
    setUploadedFilename(filename);
    setResumeData(data);
  };

  const handleReset = () => {
    setExtractedData(null);
    setUploadedFilename('');
    setResumeData(null);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/setup"
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-slate-400 hover:text-blue-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Configuration</span>
        </Link>
      </div>

      {/* Header card */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/80 dark:border-slate-800 bg-white/85 dark:bg-gradient-to-b dark:from-slate-900/80 dark:to-slate-950 p-6 sm:p-8 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-cyan-400 mb-2">
          <Cloud className="h-3.5 w-3.5" />
          <span>Step 2 of 4 • Resume Analysis</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1220] dark:text-white tracking-tight">
          {extractedData ? 'Confirm Your Resume Profile' : 'Upload Your Resume'}
        </h1>
        <p className="mt-2 max-w-2xl text-xs sm:text-sm text-neutral-600 dark:text-slate-400 leading-relaxed">
          {extractedData
            ? 'Our AI has extracted your background, tech stack, and experience. Verify or adjust any details before entering the interview.'
            : 'Upload your PDF or DOCX resume. We extract your skills, languages, and projects in-memory to tailor personalized interview questions.'}
        </p>
      </div>

      {/* Main Container */}
      <div className="rounded-3xl border border-white/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0b1220]/80 p-6 sm:p-8 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:shadow-2xl">
        {extractedData ? (
          <ResumeSummary
            data={extractedData}
            filename={uploadedFilename}
            onReset={handleReset}
          />
        ) : (
          <ResumeUpload onAnalysisComplete={handleAnalysisComplete} />
        )}
      </div>
    </div>
  );
}
