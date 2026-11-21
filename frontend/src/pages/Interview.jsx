import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import interviewApi from '../services/interviewApi';
import AIInterviewer from '../components/AIInterviewer';
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2, Mic, ArrowRight } from 'lucide-react';

export default function Interview() {
  const navigate = useNavigate();
  const { config, resumeData, interviewSession, setInterviewSession, resetSession, setFinalReport } = useInterview();

  const isMatchingSession =
    interviewSession &&
    interviewSession.questions?.length >= 6 &&
    interviewSession.company?.trim().toLowerCase() === config?.finalCompany?.trim().toLowerCase() &&
    interviewSession.role?.trim().toLowerCase() === config?.finalRole?.trim().toLowerCase();

  const [isLoading, setIsLoading] = useState(!isMatchingSession);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [questions, setQuestions] = useState(isMatchingSession ? interviewSession.questions : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionEvaluations, setSessionEvaluations] = useState(isMatchingSession ? (interviewSession.evaluations || []) : []);
  const [sessionAnswers, setSessionAnswers] = useState(isMatchingSession ? (interviewSession.answers || []) : []);
  const [hasJoinedStudio, setHasJoinedStudio] = useState(
    Boolean(isMatchingSession && (interviewSession.answers?.length > 0 || interviewSession.evaluations?.length > 0))
  );
  const sessionEvaluationsRef = useRef(isMatchingSession ? (interviewSession.evaluations || []) : []);
  const sessionAnswersRef = useRef(isMatchingSession ? (interviewSession.answers || []) : []);
  const initializedRef = useRef(false);

  const handleRestartInterview = () => {
    if (setFinalReport) setFinalReport(null);
    resetSession();
    navigate('/setup');
  };

  const handleJoinStudio = () => {
    // 1. Prime browser SpeechSynthesis inside direct user click gesture
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      } catch (_) {}
    }
    // 2. Unlock Web Audio Context
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        ctx.resume();
      }
    } catch (_) {}

    setHasJoinedStudio(true);
  };

  // Initialize or resume interview session
  useEffect(() => {
    if (!config) {
      navigate('/setup');
      return;
    }

    // Only reuse session if it matches the current company and role perfectly
    const matchesCurrentConfig =
      interviewSession &&
      interviewSession.questions?.length >= 6 &&
      interviewSession.company?.trim().toLowerCase() === config.finalCompany?.trim().toLowerCase() &&
      interviewSession.role?.trim().toLowerCase() === config.finalRole?.trim().toLowerCase();

    if (matchesCurrentConfig) {
      setQuestions(interviewSession.questions);
      setIsLoading(false);
      return;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    const startNewInterview = async () => {
      setIsLoading(true);
      setErrorMessage('');
      if (setFinalReport) setFinalReport(null);
      try {
        const payload = {
          company: config.finalCompany || 'Google',
          role: config.finalRole || 'Software Engineer',
          interview_type: config.interviewType || 'Technical Interview',
          difficulty: config.difficulty || 'Intermediate',
          duration_minutes: config.durationMinutes || 10,
          job_description: config.jobDescription || '',
          resume_data: resumeData || null,
        };

        const response = await interviewApi.startInterview(payload);
        if (response.data && response.data.all_questions) {
          const generatedQuestions = response.data.all_questions;
          setQuestions(generatedQuestions);

          setInterviewSession({
            sessionId: response.data.session_id,
            company: config.finalCompany,
            role: config.finalRole,
            difficulty: config.difficulty,
            interviewType: config.interviewType,
            durationMinutes: config.durationMinutes || 10,
            questions: generatedQuestions,
            answers: [],
            evaluations: [],
          });
        } else {
          throw new Error('Did not receive question set from interview engine.');
        }
      } catch (err) {
        console.error('Failed to start interview:', err);
        setErrorMessage(
          err.response?.data?.detail ||
          err.message ||
          'Failed to initialize AI interview. Please ensure backend server is running.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    startNewInterview();
  }, [config, resumeData, interviewSession, setInterviewSession, navigate]);

  const handleAnswerEvaluated = (evaluation, answerText) => {
    if (!evaluation) return;
    const updatedEvaluations = [...sessionEvaluationsRef.current, evaluation];
    const updatedAnswers = [...sessionAnswersRef.current, answerText || 'Completed question'];

    sessionEvaluationsRef.current = updatedEvaluations;
    sessionAnswersRef.current = updatedAnswers;

    setSessionEvaluations(updatedEvaluations);
    setSessionAnswers(updatedAnswers);

    // Update in context
    setInterviewSession((prev) => ({
      ...prev,
      evaluations: updatedEvaluations,
      answers: updatedAnswers,
    }));
  };

  const handleNextQuestion = async (providedNextQ = null) => {
    // If a next question is already provided directly by the conversational turn
    if (providedNextQ) {
      const exists = questions.some((q) => q.question_number === providedNextQ.question_number);
      const updatedQuestions = exists ? questions : [...questions, providedNextQ];
      setQuestions(updatedQuestions);
      setInterviewSession((prev) => ({
        ...prev,
        questions: updatedQuestions,
      }));
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    // If next question is already in memory
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    // Unlimited questions: fetch or dynamically generate next question from backend
    setIsLoadingNext(true);
    try {
      const payload = {
        session_id: interviewSession?.sessionId,
        next_question_number: currentIndex + 2,
        cached_questions: questions,
        previous_answers: sessionAnswers,
        company: config?.finalCompany || 'Google',
        role: config?.finalRole || 'Software Engineer',
        difficulty: config?.difficulty || 'Intermediate',
        interview_type: config?.interviewType || 'Technical Interview',
      };

      const res = await interviewApi.nextQuestion(payload);
      if (res.data && res.data.question) {
        const newQ = res.data.question;
        const updatedQuestions = [...questions, newQ];
        setQuestions(updatedQuestions);
        setInterviewSession((prev) => ({
          ...prev,
          questions: updatedQuestions,
        }));
        setCurrentIndex((prev) => prev + 1);
      } else {
        alert('The AI interviewer did not return a new question.');
      }
    } catch (err) {
      console.error('Failed to generate next dynamic question:', err);
      alert('Unable to generate the next question. Please check backend connection.');
    } finally {
      setIsLoadingNext(false);
    }
  };

  const handleConcludeAndReport = (finalEval = null, finalAns = null) => {
    let currentEvals = sessionEvaluationsRef.current;
    let currentAns = sessionAnswersRef.current;

    if (finalEval) {
      currentEvals = [...currentEvals, finalEval];
      currentAns = [...currentAns, finalAns || 'Completed question'];
      sessionEvaluationsRef.current = currentEvals;
      sessionAnswersRef.current = currentAns;
      setSessionEvaluations(currentEvals);
      setSessionAnswers(currentAns);
    }

    const updatedSession = {
      ...(interviewSession || {}),
      evaluations: currentEvals,
      answers: currentAns,
      questions: questions,
    };

    try {
      const saved = sessionStorage.getItem('ai_interview_coach_session');
      const parsed = saved ? JSON.parse(saved) : {};
      parsed.interviewSession = updatedSession;
      delete parsed.finalReport;
      sessionStorage.setItem('ai_interview_coach_session', JSON.stringify(parsed));
    } catch (_) {}

    if (setFinalReport) {
      setFinalReport(null);
    }
    setInterviewSession(updatedSession);

    navigate('/report', {
      state: {
        evaluations: currentEvals,
        answers: currentAns,
        questions: questions,
        sessionId: interviewSession?.sessionId,
        concludedAt: Date.now(),
      },
    });
  };

  const handleEndInterviewEarly = (skipConfirm = false) => {
    const answeredCount = sessionEvaluationsRef.current.length || sessionAnswersRef.current.length;
    if (skipConfirm || answeredCount < 1) {
      navigate('/');
      return;
    }

    if (
      confirm(
        `You have answered ${answeredCount} technical interview question(s). Ready to conclude this session and view your comprehensive evaluation report?`
      )
    ) {
      handleConcludeAndReport();
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-[#f5f9ff] text-[#0b1220] dark:bg-[#07111f] dark:text-slate-100">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-500/10 border border-sky-500/30 text-sky-500 mb-6 shadow-2xl shadow-sky-500/20">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
        <h2 className="text-xl font-bold mb-2">
          Initializing Your AI Interview
        </h2>
        <p className="max-w-md text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Scraping authentic industry interview questions and tailoring a sequence for {config?.finalRole} at {config?.finalCompany}...
        </p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="inline-flex p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Unable to Start Interview</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{errorMessage}</p>
        <button
          type="button"
          onClick={() => navigate('/setup')}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 text-white px-4 py-2 text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Setup</span>
        </button>
      </div>
    );
  }

  // Pre-Studio Green Room: Ensures fresh browser user-gesture token for 100% reliable voice synthesis autoplay
  if (!hasJoinedStudio && questions.length > 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-[#f5f9ff] text-[#0b1220] dark:bg-[#07111f] dark:text-slate-100 transition-colors duration-200">
        <div className="w-full max-w-xl rounded-3xl border border-blue-200/80 dark:border-cyan-500/30 bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-xl p-6 sm:p-8 text-center animate-fadeIn">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-5 tracking-wide">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>AI VIRTUAL INTERVIEW STUDIO READY</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Welcome to {config?.finalCompany || 'Your'} Interview
          </h2>
          <p className="text-sm font-semibold text-blue-600 dark:text-cyan-400 mb-6">
            {config?.finalRole || 'Software Engineer'} • {config?.interviewType || 'Technical Interview'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
            <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700/60 flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 dark:bg-cyan-500/20 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Lead Interviewer Online</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Alex Vance conducting Round 1</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700/60 flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 dark:bg-cyan-500/20 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Questions Prepared</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{questions.length} Tailored Technical & Coding probes</p>
              </div>
            </div>
          </div>

          {/* Enter Studio Button */}
          <button
            type="button"
            onClick={handleJoinStudio}
            className="w-full group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 dark:from-cyan-500 dark:via-blue-600 dark:to-cyan-600 px-6 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/25 dark:shadow-cyan-500/25 transition-all duration-200 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Mic className="h-5 w-5" />
            <span>Join Interview Studio & Start</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-500">
            Clicking activates the interviewer's voice and connects audio directly in your browser.
          </p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="w-full h-screen max-h-screen overflow-hidden bg-[#f5f9ff] text-[#0b1220] dark:bg-[#07111f] dark:text-slate-100 transition-colors duration-200">
      {currentQ && (
        <AIInterviewer
          currentQuestion={currentQ}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          completedCount={sessionEvaluations.length}
          durationMinutes={config?.durationMinutes || 10}
          isLoadingNext={isLoadingNext}
          company={config?.finalCompany || 'Google'}
          role={config?.finalRole || 'Software Engineer'}
          difficulty={config?.difficulty || 'Intermediate'}
          interviewType={config?.interviewType || 'Technical Interview'}
          resumeData={resumeData}
          sessionId={interviewSession?.sessionId}
          onAnswerEvaluated={handleAnswerEvaluated}
          onNextQuestion={handleNextQuestion}
          onConcludeAndReport={handleConcludeAndReport}
          onEndInterview={handleEndInterviewEarly}
          onRestartInterview={handleRestartInterview}
        />
      )}
    </div>
  );
}
