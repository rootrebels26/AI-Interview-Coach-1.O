import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Send,
  Loader2,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  Clock,
  LogOut,
  ChevronRight,
  FileText,
  Lightbulb,
  Award,
  Settings,
  X,
  Eye,
  StickyNote,
  Sun,
  Moon,
  Move,
  GripHorizontal,
  Layers,
  MessageSquare,
  Maximize2,
  Minimize2,
  Target,
  Compass,
  HelpCircle,
  Activity,
} from 'lucide-react';
import AIAvatar from './AIAvatar';
import useAudioRecorder from '../hooks/useAudioRecorder';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import useCameraMonitor from '../hooks/useCameraMonitor';
import useTabDetection from '../hooks/useTabDetection';
import { useInterview } from '../context/InterviewContext';
import interviewApi from '../services/interviewApi';

export default function AIInterviewer({
  currentQuestion,
  questionNumber,
  totalQuestions = 6,
  completedCount = 0,
  durationMinutes = 10,
  isLoadingNext = false,
  company = 'Innovatech Inc.',
  role = 'Senior UX Designer',
  difficulty = 'Intermediate',
  interviewType = 'Technical Interview',
  resumeData = null,
  sessionId = null,
  onAnswerEvaluated,
  onNextQuestion,
  onConcludeAndReport,
  onEndInterview,
  onRestartInterview,
}) {
  const { theme, setTheme, toggleTheme } = useInterview();
  const isDark = theme === 'nitya-dark';

  const {
    isRecording,
    transcript,
    setTranscript,
    micError,
    isTranscribing,
    recordingDuration,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useAudioRecorder();

  const {
    isSpeaking,
    voiceEnabled,
    setVoiceEnabled,
    speak,
    replay,
    testVoice,
    voices,
    selectedVoice,
    selectVoiceByName,
    gender,
    setGender,
    stop: stopSpeaking,
  } = useSpeechSynthesis();

  const [interviewerPersona, setInterviewerPersona] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nitya_interviewer_persona') || 'alex';
    }
    return 'alex';
  });

  const handlePersonaChange = useCallback(
    (newPersona, shouldSpeakConfirmation = true) => {
      setInterviewerPersona(newPersona);
      try {
        localStorage.setItem('nitya_interviewer_persona', newPersona);
      } catch (_) {}
      const targetGender = newPersona === 'alex' ? 'male' : 'female';
      setGender(targetGender);
      if (shouldSpeakConfirmation && voiceEnabled) {
        testVoice(
          newPersona === 'alex'
            ? 'Hello, I am Alex Vance. I will be your interviewer.'
            : 'Hello, I am Elena Rostova. I will be your interviewer.',
          targetGender
        );
      }
    },
    [setGender, testVoice, voiceEnabled]
  );

  const {
    isCameraActive,
    cameraError,
    postureAlert,
    personAlert,
    detectedFacesCount,
    postureStatus,
    videoRef,
    startCamera,
    stopCamera,
  } = useCameraMonitor();

  const {
    tabSwitchCount,
    showWarning: showTabWarning,
    dismissWarning: dismissTabWarning,
  } = useTabDetection();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  
  // Time-based Countdown Timer State (1 min, 5 min, 10 min, 20 min, 30 min max)
  const totalDurationSeconds = Math.max(60, (Number(durationMinutes) || 10) * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(totalDurationSeconds);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const announcedTimeUpRef = useRef(false);

  // Hint Popup Modal State (Non-advancing, non-skipping)
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [hintData, setHintData] = useState(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  // Topics and Discussion History tracker
  const [exploredTopics, setExploredTopics] = useState([]);

  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [candidateNotes, setCandidateNotes] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // =========================================================================
  // RESPONSIVE MOBILE VIEW SWITCHER ('stage' | 'chat' | 'topics')
  // =========================================================================
  const [mobileView, setMobileView] = useState('stage');
  const [isCameraPipMinimized, setIsCameraPipMinimized] = useState(false);

  // =========================================================================
  // GEMINI-STYLE INTERACTIVE CONVERSATION CHAT STATE
  // =========================================================================
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [turnCount, setTurnCount] = useState(1);
  const [activeHint, setActiveHint] = useState(null);
  const [lastSpokenText, setLastSpokenText] = useState('');
  const chatEndRef = useRef(null);

  // Sync live microphone transcript into chat input box ONLY while actively recording
  useEffect(() => {
    if (isRecording && transcript) {
      setInputText(transcript);
    }
  }, [transcript, isRecording]);

  // Safe recording toggle: strictly silences AI voice and clears echo before opening microphone
  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      // 1. Instantly silence AI speech so the microphone never transcribes the AI's words
      stopSpeaking();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
      }
      clearTranscript();
      setInputText('');
      // 2. Small delay to ensure audio output buffer completely drains before mic starts listening
      setTimeout(async () => {
        clearTranscript();
        await startRecording();
      }, 100);
    }
  }, [isRecording, stopRecording, startRecording, stopSpeaking, clearTranscript]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting]);

  // =========================================================================
  // DRAGGABLE CAMERA PIP FRAME STATE & HANDLERS
  // =========================================================================
  const [cameraPos, setCameraPos] = useState({ x: 380, y: 440 });
  const [isDraggingCamera, setIsDraggingCamera] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  // Initialize camera position nicely adapted to mobile or desktop screen
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    const defaultX = isMobile
      ? Math.max(10, window.innerWidth - 145)
      : Math.max(20, Math.floor(window.innerWidth * 0.28));
    const defaultY = isMobile
      ? 65
      : Math.max(80, window.innerHeight - 250);
    setCameraPos({ x: defaultX, y: defaultY });
  }, []);

  const handleCameraMouseDown = (e) => {
    if (e.button !== 0) return; // Only primary mouse button
    isDraggingRef.current = true;
    setIsDraggingCamera(true);
    dragOffsetRef.current = {
      x: e.clientX - cameraPos.x,
      y: e.clientY - cameraPos.y,
    };
  };

  const handleCameraTouchStart = (e) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      setIsDraggingCamera(true);
      const touch = e.touches[0];
      dragOffsetRef.current = {
        x: touch.clientX - cameraPos.x,
        y: touch.clientY - cameraPos.y,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const frameWidth = 200;
      const frameHeight = 130;
      const maxX = Math.max(10, window.innerWidth - frameWidth - 10);
      const maxY = Math.max(60, window.innerHeight - frameHeight - 10);
      const newX = Math.min(Math.max(10, e.clientX - dragOffsetRef.current.x), maxX);
      const newY = Math.min(Math.max(60, e.clientY - dragOffsetRef.current.y), maxY);
      setCameraPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDraggingCamera(false);
      }
    };

    const handleTouchMove = (e) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const frameWidth = 200;
      const frameHeight = 130;
      const maxX = Math.max(10, window.innerWidth - frameWidth - 10);
      const maxY = Math.max(60, window.innerHeight - frameHeight - 10);
      const newX = Math.min(Math.max(10, touch.clientX - dragOffsetRef.current.x), maxX);
      const newY = Math.min(Math.max(60, touch.clientY - dragOffsetRef.current.y), maxY);
      setCameraPos({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      setIsDraggingCamera(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Sync countdown timer with chosen duration
  useEffect(() => {
    setRemainingSeconds(Math.max(60, (Number(durationMinutes) || 10) * 60));
  }, [durationMinutes]);

  // Live countdown timer (1 min, 5 min, 10 min, 20 min, 30 min)
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSecs) => {
    const m = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const s = String(totalSecs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // Announce time's up via AI voice when interview duration concludes
  useEffect(() => {
    if (isTimeUp && !announcedTimeUpRef.current) {
      announcedTimeUpRef.current = true;
      const timeUpNotice = "Time is up for this interview session! You did a fantastic job working through these engineering questions. You can now conclude and view your complete performance evaluation report.";
      speak(timeUpNotice);
      setMessages((prev) => [
        ...prev,
        {
          id: `timeup-${Date.now()}`,
          role: 'interviewer',
          text: timeUpNotice,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isTimeUpNotice: true,
        },
      ]);
    }
  }, [isTimeUp, speak]);

  const candidateRawName = resumeData?.candidate_name?.trim() || '';
  const invalidNamePattern = /^(candidate|unknown|n\/a|none|null|online|viva|portal|examination|exam|system|developer|engineer|software|app|dashboard|resume|user)$/i;
  const isRealCandidateName = Boolean(
    candidateRawName &&
    candidateRawName.length >= 2 &&
    !invalidNamePattern.test(candidateRawName.toLowerCase()) &&
    !invalidNamePattern.test(candidateRawName.split(/\s+/)[0]?.toLowerCase())
  );
  const candidateName = isRealCandidateName ? candidateRawName : '';
  const displayCandidateName = candidateName || 'Candidate';
  const candidateEmail = resumeData?.contact_info?.email || (candidateName ? `${candidateName.toLowerCase().replace(/\s+/g, '.')}@email.com` : 'candidate@email.com');
  const interviewId = Math.floor(1000 + Math.random() * 9000);

  // Dynamic conversation focus topic
  const currentPartTitle = currentQuestion?.part_title || currentQuestion?.category || `Topic #${questionNumber}`;
  const currentPartProgress = `Depth Lvl ${turnCount === 1 ? '1' : turnCount === 2 ? '2' : '3'}`;

  // Keep track of explored topics
  useEffect(() => {
    if (currentQuestion?.question_text) {
      setExploredTopics((prev) => {
        const title = currentQuestion.part_title || currentQuestion.category || `Discussion #${questionNumber}`;
        if (!prev.some((item) => item.number === questionNumber)) {
          return [...prev, { number: questionNumber, title, concepts: currentQuestion.expected_concepts || [] }];
        }
        return prev;
      });
    }
  }, [currentQuestion, questionNumber]);

  const spokenQuestionKeyRef = useRef('');

  // Automatically speak and present question upon change in conversation stream
  useEffect(() => {
    if (!currentQuestion) return;

    const currentKey = `${questionNumber}_${currentQuestion.question_text || ''}`;
    if (spokenQuestionKeyRef.current === currentKey) {
      return;
    }
    spokenQuestionKeyRef.current = currentKey;

    setEvaluationResult(null);
    clearTranscript();
    setInputText('');
    setTurnCount(1);
    setActiveHint(null);
    let questionText = currentQuestion.spoken_prompt || currentQuestion.question_text;
    // Clean any accidental "Online" salutation
    questionText = questionText.replace(/,\s*Online[!.]?/gi, '!');
    if (questionNumber === 1 && candidateName) {
      const firstName = candidateName.split(' ')[0];
      if (!invalidNamePattern.test(firstName.toLowerCase()) && !questionText.includes(firstName)) {
        questionText = questionText.replace(/^(Welcome to [^,!?]+)[!.]?/i, `$1, ${firstName}!`);
      }
    } else if (questionNumber > 1 && candidateName) {
      // Enforce zero repetitive name callouts on subsequent questions (no "Sagnik, Sagnik, Sagnik")
      const firstName = candidateName.split(' ')[0];
      if (!invalidNamePattern.test(firstName.toLowerCase())) {
        const nameRegex = new RegExp(`^(?:hi|hello|hey|welcome|thanks|thank you)?\\s*,?\\s*${firstName}\\s*[,!:\\-]\\s*`, 'i');
        questionText = questionText.replace(nameRegex, '');
      }
    }
    setLastSpokenText(questionText);

    // Add interviewer opening question to chat if not already present
    setMessages((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].text === questionText) {
        return prev;
      }
      return [
        ...prev,
        {
          id: `q-${questionNumber}-${Date.now()}`,
          role: 'interviewer',
          text: questionText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOpening: true,
          partTitle: currentPartTitle,
          questionNumber: questionNumber,
        },
      ];
    });

    // Micro-delay guarantees audio synthesis readiness and initiates lifelike avatar lip movement
    const timer = setTimeout(() => {
      speak(questionText);
    }, 120);

    return () => {
      clearTimeout(timer);
    };
  }, [currentQuestion, questionNumber, speak, clearTranscript, currentPartTitle, candidateName]);

  // Clean up speech synthesis ONLY when component unmounts from page
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Handle opening the non-advancing Hint popup modal
  const handleOpenHint = async () => {
    setIsHintModalOpen(true);
    if (!hintData || hintData.questionText !== currentQuestion?.question_text) {
      setIsLoadingHint(true);
      try {
        const payload = {
          session_id: sessionId,
          role,
          company,
          question_text: currentQuestion?.question_text || '',
          expected_concepts: currentQuestion?.expected_concepts || [],
        };
        const res = await interviewApi.getHint(payload);
        if (res.data) {
          setHintData({
            questionText: currentQuestion?.question_text,
            ...res.data,
          });
        }
      } catch (err) {
        console.warn('Hint fetch error, using client fallback:', err);
        setHintData({
          questionText: currentQuestion?.question_text,
          hint_title: `${role} Guidance`,
          hint_text: 'Focus on fundamental engineering principles: trace how data enters the system, where latency spikes, and how to isolate errors cleanly.',
          mental_model: 'First-Principles System Architecture',
          guiding_questions: [
            'What is the primary operational constraint or single point of failure?',
            'How would this component behave under high concurrent load?'
          ],
        });
      } finally {
        setIsLoadingHint(false);
      }
    }
  };

  // Handle conversational interaction (Candidate speaks/types, Interviewer replies/hints/advances)
  const handleSendMessage = async (customText = null, isHint = false) => {
    const textToSend = (customText !== null ? customText : inputText).trim();
    if (!textToSend && !isHint) return;

    if (isRecording) {
      await stopRecording({ skipWhisper: true, cancel: true });
    }
    stopSpeaking();

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `usr-${Date.now()}`,
      role: 'candidate',
      questionNumber: questionNumber,
      text: textToSend || (isHint ? "Could you give me a hint on how to approach this?" : ""),
      timestamp,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    clearTranscript();
    setIsSubmitting(true);

    try {
      const dialogueHistory = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const payload = {
        session_id: sessionId,
        question_number: questionNumber,
        question_text: currentQuestion.question_text,
        expected_concepts: currentQuestion.expected_concepts || [],
        candidate_message: userMsg.text,
        dialogue_history: dialogueHistory,
        turn_count_for_question: turnCount,
        request_hint: isHint,
        company: company || 'Google',
        role: role || 'Software Engineer',
        difficulty: difficulty || 'Intermediate',
        interview_type: interviewType || 'Technical Interview',
      };

      const res = await interviewApi.converse(payload);
      if (res.data) {
        const reply = res.data;
        const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const aiMsg = {
          id: `ai-${Date.now()}`,
          role: 'interviewer',
          text: reply.interviewer_reply,
          timestamp: aiTime,
          intent: reply.intent,
          isHint: reply.intent === 'hint_and_nudge' || Boolean(reply.hint),
          hint: reply.hint,
          isSatisfied: reply.is_satisfied,
        };

        setMessages((prev) => [...prev, aiMsg]);
        setLastSpokenText(reply.interviewer_reply);
        speak(reply.interviewer_reply);

        if (reply.hint) {
          setActiveHint(reply.hint);
        }

        if (reply.should_advance) {
          if (reply.evaluation) {
            setEvaluationResult(reply.evaluation);
            onAnswerEvaluated(reply.evaluation, reply.cumulative_answer || userMsg.text);
          }
          // Allow natural conversational spacing so candidate hears the interviewer's feedback
          // before the next question card appears
          setTimeout(() => {
            setTurnCount(1);
            if (reply.next_question) {
              onNextQuestion(reply.next_question);
            } else if (onNextQuestion) {
              onNextQuestion();
            }
          }, 2200);
        } else {
          setTurnCount((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.error('Conversation turn error:', err);
      const lowerText = userMsg.text.toLowerCase().trim();
      let fallback = "Understood. Could you drill into the technical architecture and trade-offs you considered?";

      if (isHint || /stuck|don'?t know|dont know|cant|cannot|help|dont work|^no[\s\.\?!]*$|^nope[\s\.\?!]*$|^nah[\s\.\?!]*$/i.test(lowerText)) {
        if (turnCount >= 2) {
          fallback = "No problem at all, let's keep moving forward! Click 'Next Question' below to proceed to our next topic.";
        } else {
          fallback = "No worries at all, that's completely fair! Let's think through a simpler scenario: what framework, database, or architecture pattern would you choose to solve this?";
        }
      } else if (/\b(how do you know me|who are you|who am i|what is your name)\b/i.test(lowerText)) {
        fallback = `I am your AI Senior Technical Interviewer for this ${role} position at ${company}. I have your resume and technical projects in front of me! Walk me through your engineering background and the main tech stacks you build with.`;
      } else if (/\b(i am|i'm|my name is|this is)\b/i.test(lowerText) && !/\b(a|an|the|software|developer|engineer|backend|frontend)\b/i.test(lowerText)) {
        const nameMatch = userMsg.text.match(/\b(?:i\s+am|i'm|my\s+name\s+is|this\s+is)\s+([a-zA-Z]+)/i);
        const detectedName = nameMatch && !/^(good|fine|ready|here|audible|testing|online|user|candidate)$/i.test(nameMatch[1]) ? ` ${nameMatch[1]}` : '';
        fallback = `Great to meet you${detectedName}! Welcome to ${company}. To kick things off, could you tell me about the technologies or programming languages you've been working with recently?`;
      } else if (/\b(hi|hello|hey|greetings)\b/i.test(lowerText) && lowerText.split(/\s+/).length <= 3) {
        fallback = `Hello! Great to connect with you today for this ${role} interview at ${company}. Could you tell me a little about yourself and what you've been building recently?`;
      } else if (/\b(audible|audiable|mic|hear me)\b/i.test(lowerText)) {
        fallback = "Hearing you loud and clear! Whenever you're ready, let's explore your technical background. What kind of engineering projects have you built recently?";
      } else if (lowerText.split(/\s+/).length < 5) {
        fallback = "Could you walk me through the specific architectural patterns and trade-offs you would choose for this?";
      } else {
        fallback = "That gives me good context. Looking at that setup, what were your biggest scaling bottlenecks, and how did you handle edge cases or concurrent requests?";
      }
      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'interviewer',
          text: fallback,
          timestamp: aiTime,
        },
      ]);
      setLastSpokenText(fallback);
      speak(fallback);
      setTurnCount((prev) => prev + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (evaluationResult) {
        onAnswerEvaluated(evaluationResult, inputText || 'Completed question');
        setEvaluationResult(null);
      } else {
        // Candidate manually advanced before automatic turn completion:
        // Evaluate the cumulative conversation for this specific question
        try {
          const candidateResponses = messages
            .filter((m) => m.role === 'candidate' && (m.questionNumber === questionNumber || !m.questionNumber))
            .map((m) => m.text)
            .join(' ');
          const answerToEval = (inputText ? `${candidateResponses} ${inputText}` : candidateResponses).trim();
          if (answerToEval) {
            const evalRes = await interviewApi.evaluateAnswer({
              session_id: sessionId,
              question_number: questionNumber,
              question_text: currentQuestion?.question_text || '',
              candidate_answer: answerToEval,
              expected_concepts: currentQuestion?.expected_concepts || [],
              company,
              role,
              difficulty,
            });
            if (evalRes?.data) {
              onAnswerEvaluated(evalRes.data, answerToEval);
            }
          }
        } catch (e) {
          console.warn('Evaluation on next question failed:', e);
        }
      }
    } finally {
      setIsSubmitting(false);
      clearTranscript();
      setInputText('');
      setTurnCount(1);
      if (onNextQuestion) {
        onNextQuestion();
      }
    }
  };

  const [isConcluding, setIsConcluding] = useState(false);

  const handleConclude = async () => {
    if (isConcluding) return;
    setIsConcluding(true);
    try {
      let finalEval = evaluationResult;
      let finalAns = inputText || '';

      if (!finalEval) {
        // Collect candidate responses for the current question
        const candidateResponses = messages
          .filter((m) => m.role === 'candidate' && (m.questionNumber === questionNumber || !m.questionNumber))
          .map((m) => m.text)
          .join(' ');
        finalAns = (inputText ? `${candidateResponses} ${inputText}` : candidateResponses).trim();

        if (finalAns) {
          try {
            const evalRes = await interviewApi.evaluateAnswer({
              session_id: sessionId,
              question_number: questionNumber,
              question_text: currentQuestion?.question_text || '',
              candidate_answer: finalAns,
              expected_concepts: currentQuestion?.expected_concepts || [],
              company: company || 'Google',
              role: role || 'Software Engineer',
              difficulty: difficulty || 'Intermediate',
            });
            if (evalRes?.data) {
              finalEval = evalRes.data;
            }
          } catch (e) {
            console.warn('Conclude evaluation note:', e);
          }
        }
      }

      if (onConcludeAndReport) {
        onConcludeAndReport(finalEval, finalAns);
      }
    } finally {
      setIsConcluding(false);
    }
  };

  // Compute pacing and keywords
  const keywordsList = currentQuestion?.expected_concepts?.slice(0, 3)?.join(', ') || 'Leadership, Problem Solving';
  const speakingMinutes = Math.floor(recordingDuration / 60);
  const speakingSecs = String(recordingDuration % 60).padStart(2, '0');

  return (
    <div
      className={`relative w-full h-screen max-h-screen overflow-hidden flex flex-col font-sans select-none transition-colors duration-200 ${
        isDark ? 'bg-[#07111f] text-slate-100' : 'bg-[#f5f9ff] text-[#0b1220]'
      }`}
    >
      {/* =========================================================================
          TAB SWITCH WARNING BANNER (Matching Image 1 Exactly)
         ========================================================================= */}
      {showTabWarning && (
        <div className="absolute top-14 left-4 right-4 sm:left-12 sm:right-12 z-50 flex items-start justify-between gap-3 rounded-2xl border border-amber-500/50 bg-[#1e1305]/95 p-4 text-xs text-amber-200 backdrop-blur-2xl shadow-2xl shadow-black/80 animate-fadeIn">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-100">
                Warning: You switched away from the interview window.
              </p>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Tab switch count: <span className="font-mono font-bold text-white">{tabSwitchCount}</span>. Note: Browser visibility events detect when this window is hidden or loses focus, but cannot detect other application windows on separate monitors.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissTabWarning}
            className="rounded-lg p-1.5 text-amber-400 hover:bg-amber-500/20 hover:text-white transition-colors cursor-pointer"
            title="Dismiss warning"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          TOP HEADER BAR (Matching Image 2: "Innovatech Interview | Candidate: Emily Chen")
         ========================================================================= */}
      <header
        className={`h-12 shrink-0 border-b px-3 sm:px-6 flex items-center justify-between z-20 backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-[#09101d]/90 border-slate-800 text-slate-100'
            : 'bg-white/90 border-slate-200/90 text-[#0b1220] shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3 truncate max-w-[55%] sm:max-w-none">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-500">
            <Bot className="h-4 w-4" />
          </div>
          <h1 className="text-xs sm:text-sm font-semibold tracking-wide flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="font-bold truncate">{company} Interview</span>
            <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>|</span>
            <span className={`truncate ${isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}`}>
              Candidate: {displayCandidateName}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Tab Switch Badge */}
          {tabSwitchCount > 0 && (
            <button
              type="button"
              onClick={() => dismissTabWarning()}
              className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold text-amber-500 hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              <AlertTriangle className="h-3 w-3" />
              <span className="hidden sm:inline">Tab Switches: </span>
              <span>{tabSwitchCount}</span>
            </button>
          )}

          {/* AI Proctor Active */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-500">
            <ShieldCheck className="h-3 w-3" />
            <span>AI Proctor Active</span>
          </div>

          {/* Live Timer Countdown Badge in Header */}
          <div className={`flex items-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-mono font-bold transition-all ${
            remainingSeconds <= 60
              ? 'border-rose-500/50 bg-rose-500/10 text-rose-500 animate-pulse'
              : remainingSeconds <= 180
              ? 'border-amber-500/50 bg-amber-500/10 text-amber-500'
              : 'border-sky-500/30 bg-sky-500/10 text-sky-500'
          }`}>
            <Clock className="h-3 w-3" />
            <span>{formatCountdown(remainingSeconds)}</span>
            <span className="hidden sm:inline">({durationMinutes}m)</span>
          </div>

          {/* Topic Progress Badge */}
          <div className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-mono font-bold text-sky-500">
            <span className="hidden sm:inline">{currentPartTitle} • </span>
            <span>Topic #{questionNumber}</span>
            {completedCount >= 1 && <span className="ml-1 text-emerald-500">• ✓ {completedCount} Answered</span>}
          </div>
        </div>
      </header>

      {/* =========================================================================
          MOBILE RESPONSIVE VIEW SEGMENTED SWITCHER (Stage | Live Chat | Topics)
         ========================================================================= */}
      <div
        className={`lg:hidden flex items-center justify-between px-3 py-1.5 border-b shrink-0 z-20 transition-colors ${
          isDark ? 'bg-[#0a1222] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div
          className={`flex items-center gap-1 p-1 rounded-xl border text-xs w-full shadow-inner ${
            isDark ? 'bg-black/40 border-slate-800/80' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => setMobileView('stage')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileView === 'stage'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>Stage</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('chat')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
              mobileView === 'chat'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Live Chat</span>
            {messages.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse ml-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileView('topics')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileView === 'topics'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Topics</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN 3-COLUMN CONFERENCE WORKSPACE (Adaptive Mobile View)
         ========================================================================= */}
      <div className="flex-1 min-h-0 p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3.5 overflow-hidden">

        {/* -------------------------------------------------------------
            COLUMN 1: CANDIDATE DOSSIER & TOPICS STEPPER (Col 3)
           ------------------------------------------------------------- */}
        <aside
          className={`${
            mobileView === 'topics' ? 'flex flex-col col-span-1 h-full' : 'hidden'
          } lg:flex lg:col-span-3 flex-col gap-3 min-h-0 overflow-hidden`}
        >
          {/* Card 1: Candidate Details (Matching Image 2 Left Card) */}
          <div
            className={`rounded-2xl border p-4 backdrop-blur-md space-y-2.5 transition-colors ${
              isDark
                ? 'bg-[#101a2d]/80 border-slate-800/80 text-slate-100'
                : 'bg-white/90 border-slate-200/90 text-[#0b1220] shadow-[0_4px_20px_rgba(15,23,42,0.04)]'
            }`}
          >
            <div className="space-y-0.5">
              <p className="text-sm font-bold leading-tight">Candidate: {displayCandidateName}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({candidateEmail})</p>
            </div>

            <div
              className={`space-y-1.5 pt-2 border-t text-xs ${
                isDark ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'
              }`}
            >
              <p>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Job Title:</span>{' '}
                <span className="font-semibold">{role} (ID: {interviewId})</span>
              </p>
              <p>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Company:</span>{' '}
                <span className="font-semibold">{company}</span>
              </p>
              <p>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Stage:</span>{' '}
                <span className="font-semibold text-emerald-500">Round 1 (Technical & Behavioral)</span>
              </p>
            </div>
          </div>

          {/* Card 2: Conversational Discussion & Depth Radar (Replaces static topic stepper) */}
          <div
            className={`flex-1 rounded-2xl border p-4 backdrop-blur-md flex flex-col min-h-0 overflow-hidden transition-colors ${
              isDark
                ? 'bg-[#101a2d]/80 border-slate-800/80'
                : 'bg-white/90 border-slate-200/90 shadow-[0_4px_20px_rgba(15,23,42,0.04)]'
            }`}
          >
            {/* Header: Interview Timer & Mode */}
            <div className="flex items-center justify-between mb-2.5 shrink-0">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-[#0b1220]'}`}>
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                <span>Discussion Depth Radar</span>
              </span>
              <span className={`text-[11px] font-mono font-bold ${
                remainingSeconds <= 60
                  ? 'text-rose-500 animate-pulse'
                  : remainingSeconds <= 180
                  ? 'text-amber-500'
                  : 'text-sky-500'
              }`}>
                {formatCountdown(remainingSeconds)} left
              </span>
            </div>

            {/* Visual Time Remaining Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mb-3 overflow-hidden shrink-0">
              <div
                className={`h-full transition-all duration-1000 ${
                  remainingSeconds <= 60
                    ? 'bg-rose-500'
                    : remainingSeconds <= 180
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-cyan-400 to-blue-600'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, (remainingSeconds / totalDurationSeconds) * 100))}%` }}
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
              {/* Active Topic Card */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  isDark
                    ? 'bg-[#091224] border-sky-500/30 text-white'
                    : 'bg-sky-50/70 border-sky-200 text-[#0b1220]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-500">
                    Active Question #{questionNumber}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    Turn #{turnCount}
                  </span>
                </div>
                <h3 className="text-xs font-bold leading-snug">
                  {currentPartTitle}
                </h3>

                {/* Depth Level Indicator (Level 1 Fundamentals -> Level 2 Mechanics -> Level 3 Scale/Failures) */}
                <div className="mt-2.5 pt-2 border-t border-slate-700/40 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Probing Depth:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      turnCount >= 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-600'
                    }`}>
                      L1 Fundamentals
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      turnCount >= 2 ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'text-slate-600'
                    }`}>
                      L2 Deep Dive
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      turnCount >= 3 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : 'text-slate-600'
                    }`}>
                      L3 Scale & Edge
                    </span>
                  </div>
                </div>

                {/* Expected Concepts Tags */}
                {currentQuestion?.expected_concepts && currentQuestion.expected_concepts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {currentQuestion.expected_concepts.slice(0, 4).map((concept, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/60 dark:bg-slate-800 border border-slate-700 text-slate-300 font-mono"
                      >
                        #{concept}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Topics Explored So Far */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Topics Explored</span>
                  <span>{exploredTopics.length} Covered</span>
                </div>

                <div className="space-y-1.5">
                  {exploredTopics.map((topic) => {
                    const isCurrent = topic.number === questionNumber;
                    return (
                      <div
                        key={topic.number}
                        className={`p-2 rounded-xl border text-xs flex items-center justify-between transition-all ${
                          isCurrent
                            ? 'bg-sky-500/10 border-sky-500/40 text-sky-400 font-bold'
                            : isDark
                            ? 'bg-slate-900/50 border-slate-800 text-slate-300'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${isCurrent ? 'text-sky-400 animate-pulse' : 'text-emerald-500'}`} />
                          <span className="truncate">Q{topic.number}: {topic.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {isCurrent ? 'Active' : 'Answered'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hint Quick Action Pill in Left Panel */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleOpenHint}
                  className="w-full py-2 px-3 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.01]"
                >
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  <span>Open Technical Hint Popup</span>
                </button>
              </div>
            </div>

            {/* Posture & Presence status */}
            <div className={`mt-3 pt-3 border-t shrink-0 space-y-1.5 text-xs ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'}`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Posture:
                </span>
                <span
                  className={`font-semibold ${
                    postureStatus === 'Good' ? 'text-emerald-500' : 'text-amber-500'
                  }`}
                >
                  {postureStatus === 'Good' ? 'Upright Posture' : 'Adjust Posture'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-sky-500" />
                  Presence:
                </span>
                <span
                  className={`font-semibold ${
                    detectedFacesCount > 0 ? 'text-sky-500' : isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {detectedFacesCount > 0 ? `${detectedFacesCount} Face Detected` : 'No Face Detected'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* -------------------------------------------------------------
            COLUMN 2: CENTER VIRTUAL CALL STAGE (Col 6)
           ------------------------------------------------------------- */}
        <main
          className={`${
            mobileView === 'stage' ? 'flex flex-col col-span-1 h-full' : 'hidden'
          } lg:flex lg:col-span-6 flex-col min-h-0 rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden relative transition-colors ${
            isDark ? 'border-slate-800 bg-[#09101f]' : 'border-slate-200 bg-white'
          }`}
        >
          {/* macOS Style Window Top Bar */}
          <div
            className={`h-8 shrink-0 border-b px-3.5 flex items-center justify-between transition-colors ${
              isDark ? 'bg-[#070d18] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
            </div>
            <span className="text-[11px] font-mono">
              {company} • AI Virtual Interview Studio
            </span>
            <div className="w-12" />
          </div>

          {/* Floating Mobile Open Chat Quick Action */}
          <div className="lg:hidden absolute top-10 right-3 z-30">
            <button
              type="button"
              onClick={() => setMobileView('chat')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-sky-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <Bot className="h-3.5 w-3.5" />
              <span>Open Chat</span>
            </button>
          </div>

          {/* Video Viewport: AI Interviewer Avatar */}
          <div className="flex-1 min-h-[240px] sm:min-h-[340px] relative overflow-hidden bg-black">
            {/* Main AI Interviewer Avatar Component */}
            <AIAvatar
              isSpeaking={isSpeaking}
              isListening={isRecording}
              isAnalyzing={isSubmitting}
              company={company}
              currentQuestionText={lastSpokenText || currentQuestion?.question_text}
              spokenPrompt={lastSpokenText || currentQuestion?.spoken_prompt}
              partTitle={currentPartTitle}
              partProgress={currentPartProgress}
              personaKey={interviewerPersona}
              onPersonaChange={handlePersonaChange}
              onReplay={() => replay(lastSpokenText)}
            />

            {/* Prominent Mute AI Button during speech */}
            {isSpeaking && (
              <div className="absolute top-4 left-4 z-30 animate-fadeIn">
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600/95 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 backdrop-blur-sm transition-all cursor-pointer active:scale-95"
                  title="Silence AI speech"
                >
                  <VolumeX className="h-3.5 w-3.5 animate-pulse" />
                  <span>Mute AI Talking</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Meeting Toolbar (Matching Image 2 - Mobile Optimized) */}
          <div
            className={`h-14 sm:h-16 shrink-0 border-t px-2 sm:px-6 flex items-center justify-between backdrop-blur-xl z-20 transition-colors ${
              isDark
                ? 'bg-[#0a1222] border-slate-800 text-slate-300'
                : 'bg-white/95 border-slate-200 text-slate-700 shadow-inner'
            }`}
          >
            {/* Center Controls: Mute, Camera On, Chat (mobile), Notes, Settings */}
            <div className="flex items-center gap-1 sm:gap-4">
              {/* 1. Candidate Mute / Unmute Button */}
              <button
                type="button"
                onClick={handleToggleRecording}
                disabled={isSubmitting}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 sm:px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  isRecording
                    ? 'text-rose-500 bg-rose-500/10 font-bold'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-700 hover:text-[#0b1220] hover:bg-slate-100'
                }`}
                title={isRecording ? 'Click to Mute / Stop Recording' : 'Click to Unmute / Record Answer'}
              >
                {isRecording ? <MicOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                <span className="text-[9px] sm:text-[10px] font-medium">{isRecording ? 'Mute' : 'Unmute'}</span>
              </button>

              {/* 1b. Mute AI Voice Control Button */}
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    setVoiceEnabled((prev) => !prev);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 sm:px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  isSpeaking
                    ? 'text-amber-400 bg-amber-500/15 font-bold animate-pulse'
                    : !voiceEnabled
                    ? 'text-rose-400 bg-rose-500/10'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-700 hover:text-[#0b1220] hover:bg-slate-100'
                }`}
                title={isSpeaking ? 'Click to Mute AI Speaking' : voiceEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
              >
                {isSpeaking || !voiceEnabled ? (
                  <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
                <span className="text-[9px] sm:text-[10px] font-medium">
                  {isSpeaking ? 'Mute AI' : voiceEnabled ? 'AI Audio' : 'AI Muted'}
                </span>
              </button>

              {/* 2. Camera On / Off (Orange highlight icon matching Image 2) */}
              <button
                type="button"
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 sm:px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  isCameraActive
                    ? 'text-[#ea580c] bg-orange-500/10 font-bold'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-700 hover:text-[#0b1220] hover:bg-slate-100'
                }`}
                title={isCameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {isCameraActive ? <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#ea580c]" /> : <VideoOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                <span className="text-[9px] sm:text-[10px] font-medium">{isCameraActive ? 'Camera On' : 'Camera Off'}</span>
              </button>

              {/* Mobile Chat Quick Switcher Button */}
              <button
                type="button"
                onClick={() => setMobileView('chat')}
                className="lg:hidden flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl text-sky-400 bg-sky-500/10 font-bold transition-all cursor-pointer"
                title="Open Live Chat Dialogue"
              >
                <Bot className="h-3.5 w-3.5" />
                <span className="text-[9px] font-medium">Chat</span>
              </button>

              {/* 3. Interview Notes Scratchpad */}
              <button
                type="button"
                onClick={() => setIsNotesOpen(!isNotesOpen)}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 sm:px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  isNotesOpen
                    ? 'text-sky-500 bg-sky-500/10 font-bold'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-700 hover:text-[#0b1220] hover:bg-slate-100'
                }`}
                title="Interview Notes & Scratchpad"
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-[9px] sm:text-[10px] font-medium">Notes</span>
              </button>

              {/* 4. Settings & Theme Switcher */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 sm:px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-700 hover:text-[#0b1220] hover:bg-slate-100'
                }`}
                title="Interview Settings & Theme"
              >
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-[9px] sm:text-[10px] font-medium">Settings</span>
              </button>
            </div>

            {/* Right: Meeting Countdown Clock & Report / Leave Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                <span className={remainingSeconds <= 60 ? 'text-rose-500 font-bold animate-pulse' : isDark ? 'text-slate-300' : 'text-slate-600'}>
                  {formatCountdown(remainingSeconds)}
                </span>
              </div>

              {completedCount >= 1 || isTimeUp ? (
                <button
                  type="button"
                  disabled={isConcluding}
                  onClick={handleConclude}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 sm:px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer animate-fadeIn"
                >
                  {isConcluding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Compiling...</span>
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4" />
                      <span>View Report</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onEndInterview}
                  className="flex items-center gap-1.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] px-3 sm:px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-600/30 transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Leave</span>
                </button>
              )}
            </div>
          </div>
        </main>

        {/* -------------------------------------------------------------
            COLUMN 3: GEMINI-STYLE INTERACTIVE CONVERSATION CHAT (Col 3)
           ------------------------------------------------------------- */}
        <aside
          className={`${
            mobileView === 'chat' ? 'flex flex-col col-span-1 h-full' : 'hidden'
          } lg:flex lg:col-span-3 flex-col gap-3 min-h-0 overflow-hidden`}
        >
          <div
            className={`flex-1 rounded-2xl border p-3 sm:p-3.5 backdrop-blur-md flex flex-col min-h-0 overflow-hidden transition-colors ${
              isDark
                ? 'bg-[#101a2d]/80 border-slate-800/80 text-slate-100'
                : 'bg-white/90 border-slate-200/90 text-[#0b1220] shadow-[0_4px_20px_rgba(15,23,42,0.04)]'
            }`}
          >
            {/* Header: AI Conversation Stream */}
            <div className="flex items-center justify-between pb-2 mb-1 border-b shrink-0 transition-colors border-slate-800/50 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-[#0b1220]'}`}>
                  AI Interview Dialogue
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileView('stage')}
                  className="lg:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-400 font-bold text-[10px] hover:bg-sky-500/20 transition-all cursor-pointer"
                  title="Switch to Stage View"
                >
                  <Video className="h-3 w-3" />
                  <span>Stage</span>
                </button>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-sky-500">
                  {isSpeaking ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="hidden sm:inline">Speaking...</span>
                    </>
                  ) : isRecording ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                      <span className="hidden sm:inline">Listening...</span>
                    </>
                  ) : isSubmitting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
                      <span className="hidden sm:inline">Analyzing...</span>
                    </>
                  ) : (
                    <span>Live Chat</span>
                  )}
                </span>
              </div>
            </div>

            {/* Scrollable Gemini Chat Message Stream */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0 py-1">
              {messages.map((msg) => {
                const isAI = msg.role === 'interviewer';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${isAI ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                      {isAI ? (
                        <>
                          <div className="flex h-4 w-4 items-center justify-center rounded bg-sky-500/20 text-sky-400 font-bold text-[9px]">
                            AI
                          </div>
                          <span className="font-semibold text-sky-400">Interviewer</span>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-slate-300">You ({candidateName ? candidateName.split(' ')[0] : 'Candidate'})</span>
                        </>
                      )}
                      <span>• {msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed transition-all shadow-sm ${
                        isAI
                          ? isDark
                            ? 'bg-[#091224] border border-slate-800 text-slate-200 rounded-tl-xs'
                            : 'bg-slate-100 border border-slate-200 text-[#0b1220] rounded-tl-xs'
                          : 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-tr-xs shadow-md shadow-sky-600/10'
                      }`}
                    >
                      {/* Opening question badge */}
                      {msg.isOpening && (
                        <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                          <span>Q{msg.questionNumber}: {msg.partTitle}</span>
                        </div>
                      )}

                      {/* Message Prose */}
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {/* Hint / Tip Card (Only if a distinct separate technical hint was provided) */}
                      {msg.isHint &&
                        msg.hint &&
                        msg.hint.trim().length > 10 &&
                        msg.hint.trim().toLowerCase() !== msg.text.trim().toLowerCase() &&
                        !msg.text.toLowerCase().includes(msg.hint.trim().toLowerCase()) &&
                        !msg.hint.toLowerCase().includes(msg.text.trim().toLowerCase()) && (
                        <div className="mt-2 p-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-[11px] flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-amber-200">Interviewer Tip: </span>
                            <span>{msg.hint}</span>
                          </div>
                        </div>
                      )}

                      {/* Satisfied Badge */}
                      {msg.isSatisfied && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Topic Mastered • Advancing</span>
                        </div>
                      )}

                      {/* Replay audio button for AI speech */}
                      {isAI && (
                        <div className="mt-1.5 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => speak(msg.text)}
                            className="p-1 text-slate-400 hover:text-sky-400 rounded-lg hover:bg-slate-800/40 transition-colors cursor-pointer"
                            title="Listen to response"
                          >
                            <Volume2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Live Interviewer Thinking Indicator */}
              {isSubmitting && (
                <div className="flex flex-col gap-1 items-start animate-fadeIn">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                    <div className="flex h-4 w-4 items-center justify-center rounded bg-sky-500/20 text-sky-400 font-bold text-[9px]">
                      AI
                    </div>
                    <span className="font-semibold text-sky-400">Interviewer is thinking...</span>
                  </div>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs rounded-tl-xs flex items-center gap-1.5 ${
                      isDark ? 'bg-[#091224] border border-slate-800 text-slate-400' : 'bg-slate-100 border border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              {/* Evaluation score snippet when evaluated */}
              {evaluationResult && (
                <div className="p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-emerald-400" />
                    <span className="font-bold">Topic Evaluated:</span>
                    <span>{evaluationResult.scores?.overall_score || 85}/100</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    Continue →
                  </button>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Gemini Quick Action Chips (Ask hint popup, rephrase, next topic) */}
            <div className="py-1.5 shrink-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={handleOpenHint}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer border shadow-sm ${
                  isDark
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                    : 'border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200'
                }`}
                title="View technical hint in a popup without advancing or skipping"
              >
                <Lightbulb className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span>💡 Hint Popup</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage("Could you please rephrase or break down the question?", false)}
                disabled={isSubmitting}
                className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all cursor-pointer border ${
                  isDark
                    ? 'border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20'
                    : 'border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100'
                }`}
                title="Ask the interviewer to rephrase"
              >
                <RotateCcw className="h-3 w-3 text-sky-400" />
                <span>Rephrase</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting || isLoadingNext}
                className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all cursor-pointer border ${
                  isDark
                    ? 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="Advance to next question"
              >
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span>Next Question</span>
              </button>
            </div>

            {/* Gemini Style Chat Input Bar */}
            <div className="shrink-0 pt-1.5 border-t border-slate-800/50 dark:border-slate-800 flex flex-col gap-1.5">
              <div
                className={`relative rounded-xl border p-2 flex items-end gap-2 transition-colors ${
                  isDark
                    ? 'bg-[#070c18] border-slate-800 focus-within:border-sky-500'
                    : 'bg-slate-50 border-slate-200 focus-within:border-sky-500'
                }`}
              >
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Speak your answer or type here... (Press Enter to send)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isSubmitting}
                  rows={2}
                  className={`w-full text-xs resize-none font-sans leading-relaxed bg-transparent focus:outline-none ${
                    isDark ? 'text-slate-100 placeholder-slate-500' : 'text-[#0b1220] placeholder-slate-400'
                  }`}
                />

                {/* Voice / Mic Button */}
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  disabled={isSubmitting}
                  className={`p-2 rounded-lg transition-all cursor-pointer shrink-0 ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                      : 'bg-slate-200 text-slate-700 hover:text-black hover:bg-slate-300'
                  }`}
                  title={isRecording ? 'Click to stop speaking' : 'Click to speak answer'}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isSubmitting}
                  className="p-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 text-white disabled:opacity-30 disabled:pointer-events-none hover:from-sky-400 hover:to-indigo-500 transition-all cursor-pointer shrink-0"
                  title="Send answer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Word Count & Status */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                <span>
                  {inputText.trim() ? `${inputText.trim().split(/\s+/).filter(Boolean).length} words` : 'Type or speak your answer'}
                </span>
                <span>
                  Turn #{turnCount} on this question
                </span>
              </div>
            </div>

            {/* Analytics Summary Footer (Matching Image 2 Exactly) */}
            <div className={`mt-2 pt-2 border-t shrink-0 space-y-1 text-[11px] ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
              <div className="flex justify-between">
                <span>Current Speaking Time:</span>
                <span className={`font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {speakingMinutes}:{speakingSecs} min
                </span>
              </div>
              <div className="flex justify-between">
                <span>Keywords:</span>
                <span className={`truncate max-w-[130px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`} title={keywordsList}>
                  {keywordsList}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pacing:</span>
                <span className="text-sky-500 font-medium">Good</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* =========================================================================
          DRAGGABLE CANDIDATE CAMERA PiP FRAME (Move anywhere on the screen)
         ========================================================================= */}
      {isCameraPipMinimized ? (
        <button
          type="button"
          onClick={() => setIsCameraPipMinimized(false)}
          style={{ left: `${cameraPos.x}px`, top: `${cameraPos.y}px` }}
          className={`fixed z-40 h-8 px-2.5 rounded-full border border-sky-500/40 bg-black/85 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1.5 shadow-xl cursor-pointer ${
            mobileView !== 'stage' ? 'hidden lg:flex' : 'flex'
          }`}
          title="Expand Camera Preview"
        >
          <Video className="h-3.5 w-3.5 text-cyan-400" />
          <span>Camera</span>
          <Maximize2 className="h-3 w-3 text-slate-400" />
        </button>
      ) : (
        <div
          style={{
            left: `${cameraPos.x}px`,
            top: `${cameraPos.y}px`,
          }}
          onMouseDown={handleCameraMouseDown}
          onTouchStart={handleCameraTouchStart}
          className={`fixed z-40 w-32 sm:w-44 md:w-52 aspect-video rounded-xl overflow-hidden border-2 select-none shadow-2xl backdrop-blur-md transition-shadow group ${
            mobileView !== 'stage' ? 'hidden lg:block' : 'block'
          } ${
            isDraggingCamera
              ? 'cursor-grabbing shadow-sky-500/30 ring-2 ring-sky-400 scale-[1.02]'
              : 'cursor-grab hover:shadow-cyan-500/20'
          } ${
            isDark
              ? 'border-slate-700 bg-slate-900 shadow-black/80'
              : 'border-slate-300 bg-white shadow-slate-900/20'
          }`}
          title="Click and drag anywhere to move camera window"
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover transform -scale-x-100 pointer-events-none ${
              isCameraActive ? 'block' : 'hidden'
            }`}
          />

          {!isCameraActive && (
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950 p-2 text-center pointer-events-none">
              <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-1">
                <VideoOff className="h-3.5 w-3.5" />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Camera Off</span>
            </div>
          )}

          {/* Minimize Button */}
          <div className="absolute top-1 right-1 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCameraPipMinimized(true);
              }}
              className="p-1 rounded bg-black/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Minimize Camera Window"
            >
              <Minimize2 className="h-2.5 w-2.5" />
            </button>
          </div>

          {/* Drag Affordance Handle Indicator */}
          <div className="absolute top-1 inset-x-0 flex items-center justify-center pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm text-[8px] font-bold text-white">
              <GripHorizontal className="h-2.5 w-2.5" />
              <span className="hidden sm:inline">Drag frame</span>
            </div>
          </div>

          {/* Top Posture & Presence Status Pills */}
          <div className="absolute top-5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold shadow-md backdrop-blur-md ${
                postureStatus === 'Good'
                  ? 'bg-emerald-600/90 text-white'
                  : 'bg-amber-600/90 text-white'
              }`}
            >
              <UserCheck className="h-2 w-2" />
              <span className="hidden sm:inline">{postureStatus === 'Good' ? 'Upright' : 'Adjust'}</span>
            </span>

            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold shadow-md backdrop-blur-md ${
                detectedFacesCount > 0
                  ? 'bg-sky-600/90 text-white'
                  : 'bg-slate-800/90 text-slate-300'
              }`}
            >
              <Eye className="h-2 w-2" />
              <span>{detectedFacesCount > 0 ? 'Face' : 'None'}</span>
            </span>
          </div>

          {/* Bottom PiP Name Tag */}
          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between bg-slate-950/85 px-2 py-0.5 rounded-md backdrop-blur-sm text-[10px] pointer-events-none">
            <span className="font-semibold text-slate-200 truncate max-w-[80px] sm:max-w-[100px]">
              {displayCandidateName}
            </span>
            <span className="flex items-center gap-1">
              {isRecording ? (
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              )}
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          SLIDE-OVER INTERVIEW NOTES SCRATCHPAD
         ========================================================================= */}
      {isNotesOpen && (
        <div
          className={`absolute top-12 right-0 bottom-0 w-full sm:w-80 border-l p-4 z-50 shadow-2xl flex flex-col gap-3 animate-fadeIn transition-colors ${
            isDark ? 'bg-[#0b1322] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-[#0b1220]'
          }`}
        >
          <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <StickyNote className="h-4 w-4 text-sky-500" />
              <span>Interview Notes & Scratchpad</span>
            </div>
            <button
              type="button"
              onClick={() => setIsNotesOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Jot down private thoughts or system ideas without triggering tab switch alerts.
          </p>
          <textarea
            value={candidateNotes}
            onChange={(e) => setCandidateNotes(e.target.value)}
            placeholder="Type your private notes here..."
            className={`flex-1 w-full rounded-xl border p-3 text-xs resize-none font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-sky-500 ${
              isDark
                ? 'bg-[#070c18] border-slate-800 text-slate-100 placeholder-slate-500'
                : 'bg-slate-50 border-slate-200 text-[#0b1220] placeholder-slate-400'
            }`}
          />
        </div>
      )}

      {/* =========================================================================
          SETTINGS & LIVE THEME CHANGER MODAL
         ========================================================================= */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl space-y-4 transition-colors ${
              isDark ? 'bg-[#0d1627] border-slate-800 text-white' : 'bg-white border-slate-200 text-[#0b1220]'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-bold">Interview Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className={`p-1 rounded-lg cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-[#0b1220] hover:bg-slate-100'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* LIVE THEME SWITCHER (Nitya CloudTech Palette Feature) */}
            <div className="space-y-2">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Nitya CloudTech UI Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('nitya-light')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    !isDark
                      ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-500'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>Cloud Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('nitya-dark')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isDark
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-sm ring-1 ring-cyan-400'
                      : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Moon className="h-4 w-4 text-cyan-400" />
                  <span>Midnight Mode</span>
                </button>
              </div>
            </div>

            {/* INTERVIEWER PERSONA & VOICE SELECTOR */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Interviewer Persona & Spoken Voice
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePersonaChange('alex')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    interviewerPersona === 'alex'
                      ? 'border-cyan-500 bg-cyan-500/15 text-cyan-400 shadow-sm ring-1 ring-cyan-400'
                      : 'border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  <Bot className="h-4 w-4 text-cyan-400" />
                  <div className="text-left leading-tight">
                    <p className="font-bold">Alex Vance</p>
                    <p className="text-[10px] font-medium text-slate-400">Male Voice</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handlePersonaChange('elena')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    interviewerPersona === 'elena'
                      ? 'border-purple-500 bg-purple-500/15 text-purple-400 shadow-sm ring-1 ring-purple-400'
                      : 'border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  <Bot className="h-4 w-4 text-purple-400" />
                  <div className="text-left leading-tight">
                    <p className="font-bold">Elena Rostova</p>
                    <p className="text-[10px] font-medium text-slate-400">Female Voice</p>
                  </div>
                </button>
              </div>

              {/* Installed Browser Voice Dropdown */}
              {voices && voices.length > 0 && (
                <div className="pt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Synthesizer Voice:</span>
                    <button
                      type="button"
                      onClick={() =>
                        testVoice(
                          interviewerPersona === 'alex'
                            ? 'Hello! I am Alex Vance. I will be your interviewer.'
                            : 'Hello! I am Elena Rostova. I will be your interviewer.'
                        )
                      }
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Volume2 className="h-3 w-3" />
                      <span>Test Voice Audio</span>
                    </button>
                  </div>
                  <select
                    value={selectedVoice?.name || ''}
                    onChange={(e) => selectVoiceByName(e.target.value)}
                    className="w-full text-xs rounded-xl px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    {voices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* AI Speech Voice Toggle */}
            <div className={`flex items-center justify-between pt-2 border-t text-xs ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-700'}`}>
              <span>AI Voice Audio Playback:</span>
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`px-3 py-1.5 rounded-xl font-semibold border transition-all cursor-pointer ${
                  voiceEnabled
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                    : 'border-rose-500/40 bg-rose-500/10 text-rose-500'
                }`}
              >
                {voiceEnabled ? 'Enabled' : 'Muted'}
              </button>
            </div>

            {/* Done button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-sky-600/20"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERVIEWER HINT POPUP MODAL (User Requested: Clean popup, no auto-advance)
         ========================================================================= */}
      {isHintModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl space-y-4 transition-colors ${
              isDark ? 'bg-[#0d1627] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#0b1220]'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0b1220] dark:text-white">
                    Interviewer Hint & Technical Clue
                  </h3>
                  <p className="text-[11px] text-amber-500 font-semibold">
                    Question #{questionNumber} Guidance • Does not advance or skip question
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHintModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-[#0b1220] hover:bg-slate-100'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isLoadingHint ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                <p className="text-xs text-slate-400">Synthesizing candidate guidance clue...</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    {hintData?.hint_title || 'Key Engineering Concept'}
                  </span>
                  <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {hintData?.hint_text || 'Consider how data travels through the system and identify the primary performance bottleneck or concurrency hazard.'}
                  </p>
                </div>

                {hintData?.mental_model && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-sky-400">Mental Model:</span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300 font-mono text-[11px]">
                      {hintData.mental_model}
                    </span>
                  </div>
                )}

                {hintData?.guiding_questions && hintData.guiding_questions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Questions to think through:
                    </span>
                    <ul className={`space-y-1 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {hintData.guiding_questions.map((gq, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{gq}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
                  💡 <strong>Note:</strong> You can close this hint and continue speaking or typing your answer. Your interview progress remains on this exact topic.
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHintModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                Got It, Continue Answering
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERVIEW TIME CONCLUDED MODAL (1m, 5m, 10m, 20m, 30m complete)
         ========================================================================= */}
      {isTimeUp && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 text-center space-y-4 shadow-2xl transition-colors ${
              isDark ? 'bg-[#0d1627] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#0b1220]'
            }`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-xl shadow-amber-500/20">
              <Clock className="h-8 w-8 animate-pulse" />
            </div>
            <h3 className="text-xl font-extrabold text-[#0b1220] dark:text-white">
              Interview Time Concluded ({durationMinutes} Min)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your scheduled {durationMinutes}-minute interview has concluded. Click below to view your comprehensive AI performance report with detailed scoring, strengths, and study recommendations.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isConcluding}
                onClick={handleConclude}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isConcluding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Compiling Report...</span>
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4" />
                    <span>View Final Report →</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onRestartInterview}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Restart Interview</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
