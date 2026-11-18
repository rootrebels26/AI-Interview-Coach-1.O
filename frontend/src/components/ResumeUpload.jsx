import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import interviewApi from '../services/interviewApi';
import { useInterview } from '../context/InterviewContext';

export default function ResumeUpload({ onAnalysisComplete }) {
  const { config } = useInterview();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState(''); // 'uploading', 'analyzing', 'done', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (selectedFile) => {
    if (!selectedFile) return false;
    const name = selectedFile.name.toLowerCase();
    const isPdf = name.endsWith('.pdf');
    const isDocx = name.endsWith('.docx');

    if (!isPdf && !isDocx) {
      setErrorMessage('Please upload a PDF (.pdf) or Word document (.docx).');
      return false;
    }

    // 10MB limit
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 10MB limit. Please upload a smaller file.');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (validateFile(droppedFile)) {
      setFile(droppedFile);
      setAnalysisStatus('');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setAnalysisStatus('');
    }
  };

  const handleAnalyse = async () => {
    if (!file) return;

    setAnalysisStatus('uploading');
    setUploadProgress(20);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (config?.finalCompany) formData.append('company', config.finalCompany);
      if (config?.finalRole) formData.append('role', config.finalRole);

      // Simulate progress progression
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 15;
        });
      }, 200);

      setAnalysisStatus('analyzing');
      const response = await interviewApi.analyseResume(formData);
      clearInterval(progressTimer);
      setUploadProgress(100);

      if (response.data && response.data.resume_data) {
        setAnalysisStatus('done');
        onAnalysisComplete(response.data.resume_data, file.name);
      } else {
        throw new Error('Could not parse resume data.');
      }
    } catch (err) {
      console.error('Resume extraction error:', err);
      setAnalysisStatus('error');
      setErrorMessage(
        err.response?.data?.detail ||
        err.message ||
        'Failed to analyse resume. Please verify the document format.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-blue-600 bg-blue-50/70 dark:border-cyan-400 dark:bg-cyan-500/10 scale-[1.01]'
            : file
            ? 'border-blue-400 bg-blue-50/40 dark:border-cyan-500/50 dark:bg-slate-900/60'
            : 'border-slate-300 dark:border-slate-800 bg-blue-50/20 dark:bg-slate-900/30 hover:border-blue-400 dark:hover:border-slate-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 text-blue-700 dark:text-cyan-400 border border-blue-200 dark:border-cyan-500/30 mb-4 shadow-lg shadow-blue-500/10">
          <UploadCloud className="h-8 w-8" />
        </div>

        <h3 className="text-base font-bold text-[#0b1220] dark:text-white mb-1">
          {file ? 'Replace Resume' : 'Drop your resume here, or browse'}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-slate-400 max-w-sm mb-4">
          Supports PDF and DOCX files up to 10MB. Text is parsed securely in memory and deleted immediately after extraction.
        </p>

        <span className="rounded-full bg-white dark:bg-slate-800 px-4 py-1.5 text-xs font-semibold text-neutral-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm">
          Choose File
        </span>
      </div>

      {/* Selected File Card */}
      {file && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 p-5 backdrop-blur-md shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-cyan-500/10 text-blue-700 dark:text-cyan-400 border border-blue-200 dark:border-cyan-500/20">
                <FileText className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-[#0b1220] dark:text-white truncate max-w-[170px] sm:max-w-md">
                  {file.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500 dark:text-slate-400">
                  <span className="uppercase font-semibold text-blue-700 dark:text-cyan-400">
                    {file.name.split('.').pop()}
                  </span>
                  <span>•</span>
                  <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>
            </div>

            {analysisStatus === 'done' ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Analysed</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setAnalysisStatus('');
                }}
                className="text-xs text-neutral-400 dark:text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>

          {/* Progress / Status display */}
          {(analysisStatus === 'uploading' || analysisStatus === 'analyzing') && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-cyan-400" />
                  <span>
                    {analysisStatus === 'uploading'
                      ? 'Streaming file securely...'
                      : 'Extracting candidate background & skills with PyMuPDF...'}
                  </span>
                </div>
                <span className="font-mono">{uploadProgress}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-4 text-xs text-rose-800 dark:text-rose-300 animate-fadeIn">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action CTA */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-neutral-500 dark:text-slate-400">
          Step 2 of 4 • In-memory PyMuPDF extraction (zero permanent storage)
        </p>

        <button
          type="button"
          onClick={handleAnalyse}
          disabled={!file || analysisStatus === 'uploading' || analysisStatus === 'analyzing'}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-[#0b1220] hover:bg-blue-900 text-white dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 px-8 py-3.5 text-sm font-bold shadow-lg shadow-blue-950/10 dark:shadow-cyan-500/20 disabled:opacity-40 disabled:pointer-events-none hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          {analysisStatus === 'analyzing' || analysisStatus === 'uploading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analysing Resume...</span>
            </>
          ) : (
            <>
              <span>Analyse My Resume</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
