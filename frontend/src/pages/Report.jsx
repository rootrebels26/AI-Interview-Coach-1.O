import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import interviewApi from '../services/interviewApi';
import InterviewReport from '../components/InterviewReport';
import { Loader2, AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react';

export default function Report() {
  const navigate = useNavigate();
  const location = useLocation();
  const { finalReport, setFinalReport, interviewSession, config, resetSession } = useInterview();

  const [isLoading, setIsLoading] = useState(!finalReport);
  const [errorMessage, setErrorMessage] = useState('');
  const initializedRef = useRef(false);

  const stateEvals = location.state?.evaluations;
  const stateAnswers = location.state?.answers;
  const stateQuestions = location.state?.questions;
  const stateSessionId = location.state?.sessionId;

  const hasNewSessionData = Boolean(
    (stateEvals && stateEvals.length > 0) ||
    (stateAnswers && stateAnswers.length > 0) ||
    stateSessionId
  );

  useEffect(() => {
    // If cached finalReport exists AND no new session evaluations were submitted, use cached report
    if (finalReport && !hasNewSessionData) {
      setIsLoading(false);
      return;
    }

    if (!interviewSession && !config && !stateEvals && !stateAnswers) {
      setIsLoading(false);
      return;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    const fetchReport = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        let sessionFromStorage = null;
        try {
          const raw = sessionStorage.getItem('ai_interview_coach_session');
          if (raw) sessionFromStorage = JSON.parse(raw)?.interviewSession;
        } catch (_) {}

        const evalsToSend = (stateEvals && stateEvals.length > 0)
          ? stateEvals
          : (interviewSession?.evaluations && interviewSession.evaluations.length > 0)
          ? interviewSession.evaluations
          : sessionFromStorage?.evaluations || [];

        const answersToSend = (stateAnswers && stateAnswers.length > 0)
          ? stateAnswers
          : (interviewSession?.answers && interviewSession.answers.length > 0)
          ? interviewSession.answers
          : sessionFromStorage?.answers || [];

        const questionsToSend = (stateQuestions && stateQuestions.length > 0)
          ? stateQuestions
          : (interviewSession?.questions && interviewSession.questions.length > 0)
          ? interviewSession.questions
          : sessionFromStorage?.questions || [];

        const sessionIdToSend = stateSessionId || interviewSession?.sessionId || sessionFromStorage?.sessionId || null;

        const payload = {
          session_id: sessionIdToSend,
          company: interviewSession?.company || config?.finalCompany || 'Google',
          role: interviewSession?.role || config?.finalRole || 'Software Engineer',
          difficulty: interviewSession?.difficulty || config?.difficulty || 'Intermediate',
          interview_type: interviewSession?.interviewType || config?.interviewType || 'Technical Interview',
          questions: questionsToSend,
          answers: answersToSend,
          evaluations: evalsToSend,
        };

        const response = await interviewApi.finalReport(payload);
        if (response.data) {
          setFinalReport(response.data);
        } else {
          throw new Error('Did not receive feedback report from server.');
        }
      } catch (err) {
        console.error('Final report generation error:', err);
        setErrorMessage(
          err.response?.data?.detail ||
          err.message ||
          'Failed to compile final feedback report. Please ensure backend is reachable.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [finalReport, interviewSession, config, setFinalReport, stateEvals, stateAnswers, stateQuestions, stateSessionId]);

  const handleRestart = () => {
    resetSession();
    navigate('/setup');
  };

  const handleHome = () => {
    resetSession();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center p-4 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/30 text-blue-700 dark:text-cyan-400 mb-6 shadow-2xl shadow-blue-500/10">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-[#0b1220] dark:text-white mb-2">
          Generating Comprehensive Feedback Report
        </h2>
        <p className="max-w-md text-xs text-neutral-500 dark:text-slate-400 leading-relaxed">
          Aggregating all responses, calculating weighted dimension scores, identifying key technical gaps, and synthesizing personalized practice recommendations...
        </p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="inline-flex p-4 rounded-3xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-[#0b1220] dark:text-white mb-2">Report Compilation Notice</h2>
        <p className="text-xs text-neutral-600 dark:text-slate-400 mb-6 leading-relaxed">{errorMessage}</p>
        <div className="flex items-center justify-center gap-3">
          {errorMessage.includes('minimum of 6') && (
            <button
              type="button"
              onClick={() => navigate('/interview')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0b1220] hover:bg-blue-900 text-white dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 px-5 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              <span>Resume Interview</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Start New Interview</span>
          </button>
        </div>
      </div>
    );
  }

  if (!finalReport) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="inline-flex p-4 rounded-3xl bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-slate-400 mb-4 border border-blue-200 dark:border-transparent">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-[#0b1220] dark:text-white mb-2">No Active Report Found</h2>
        <p className="text-xs text-neutral-600 dark:text-slate-400 mb-6 leading-relaxed">
          Complete a 6-question mock interview session to unlock your comprehensive performance report.
        </p>
        <Link
          to="/setup"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0b1220] hover:bg-blue-900 text-white dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 px-6 py-2.5 text-xs font-bold transition-all shadow-md"
        >
          <span>Start Interview</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <InterviewReport
        report={finalReport}
        onRestart={handleRestart}
        onHome={handleHome}
      />
    </div>
  );
}
