// Main interview practice page with chat, voice input, and avatar speech.
import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import AvatarSpeaker from '../components/AvatarSpeaker';
import { useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Activity, AlertTriangle, Camera, CameraOff, Eye, Lightbulb, Mic, MicOff, Send, ShieldCheck } from 'lucide-react';

const renderInlineFormatting = (text) => {
    const segments = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

    return segments.map((segment, index) => {
        if (!segment) return null;

        if (segment.startsWith('`') && segment.endsWith('`')) {
            return (
                <code key={index} className="rounded-md bg-slate-200 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-950 dark:bg-slate-800 dark:text-sky-100">
                    {segment.slice(1, -1)}
                </code>
            );
        }

        if (segment.startsWith('**') && segment.endsWith('**')) {
            return <strong key={index}>{segment.slice(2, -2)}</strong>;
        }

        return segment;
    });
};

const MessageContent = ({ content }) => {
    const parts = content.split(/```(\w+)?\n?([\s\S]*?)```/g);

    return (
        <div className="space-y-4">
            {parts.map((part, index) => {
                if (!part) return null;

                const isCode = index % 3 === 2;
                const language = parts[index - 1];

                if (isCode) {
                    return (
                        <div key={index} className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-left shadow-inner">
                            {language && (
                                <div className="border-b border-slate-800 bg-slate-900 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-sky-300">
                                    {language}
                                </div>
                            )}
                            <pre className="max-w-full overflow-x-auto p-4 text-sm leading-6 text-slate-100">
                                <code>{part.trim()}</code>
                            </pre>
                        </div>
                    );
                }

                if (index % 3 === 1) return null;

                return part
                    .split(/\n{2,}/)
                    .filter(Boolean)
                    .map((paragraph, paragraphIndex) => (
                        <p key={`${index}-${paragraphIndex}`}>
                            {renderInlineFormatting(paragraph)}
                        </p>
                    ));
            })}
        </div>
    );
};

const clampScore = (score) => Math.max(0, Math.min(100, Math.round(score)));

const scoreLabel = (score) => {
    if (score >= 80) return 'Strong';
    if (score >= 60) return 'Steady';
    if (score >= 40) return 'Needs focus';
    return 'Low';
};

const getConfidenceColor = (score) => {
    if (score >= 75) return 'bg-emerald-500';
    if (score >= 45) return 'bg-amber-500';
    return 'bg-rose-500';
};

const Interview = () => {
    const requiredResponses = 6;
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [lastReply, setLastReply] = useState('');
    const [error, setError] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('');
    const [ceoImage, setCeoImage] = useState('');
    const [user, setUser] = useState({});
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [behaviorFeedback, setBehaviorFeedback] = useState([
        'Turn on video to receive live presence feedback.',
        'Your camera stays in your browser; only summary signals are sent to the coach.'
    ]);
    const [behaviorScores, setBehaviorScores] = useState({
        presence: 0,
        lighting: 0,
        eyeContact: 0,
        composure: 0,
    });
    const [behaviorSummary, setBehaviorSummary] = useState('Video feedback is off.');
    const [confidenceScore, setConfidenceScore] = useState(100);
    const [proctorWarnings, setProctorWarnings] = useState([]);
    const [interviewPaused, setInterviewPaused] = useState(false);
    const [pauseReason, setPauseReason] = useState('');
    const violationStreakRef = useRef(0);
    const focusHistoryRef = useRef([]);

    const {
        transcript,
        listening,
        resetTranscript,
    } = useSpeechRecognition();

    const chatEndRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const previousFrameRef = useRef(null);
    const faceDetectorRef = useRef(null);
    const navigate = useNavigate();

    const triggerInterviewPause = (reason) => {
        if (interviewPaused) return;

        if (listening) {
            SpeechRecognition.stopListening();
        }

        setPauseReason(reason);
        setInterviewPaused(true);
    };

    const resumeInterview = () => {
        violationStreakRef.current = 0;
        setInterviewPaused(false);
        setPauseReason('');
        setProctorWarnings(['Interview resumed. Keep your face centered and stay alone in frame.']);
        setConfidenceScore((score) => Math.max(score, 65));
    };

    const stopFlaggedInterview = () => {
        stopCamera();
        setInterviewPaused(false);
        navigate('/subject-selection');
    };

    const stopCamera = (updateState = true) => {
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        if (updateState) {
            setCameraEnabled(false);
        }
    };

    const startCamera = async () => {
        try {
            setCameraError('');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                audio: false,
            });
            mediaStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraEnabled(true);
        } catch (err) {
            console.error(err);
            setCameraError('Camera access was blocked or unavailable.');
            setCameraEnabled(false);
        }
    };

    const toggleCamera = () => {
        if (cameraEnabled) {
            stopCamera();
        } else {
            startCamera();
        }
    };

    useEffect(() => {
        const subject = localStorage.getItem('selectedSubject');
        const company = localStorage.getItem('selectedCompany') || 'General';
        const img = localStorage.getItem('ceoImage');
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!subject) {
            navigate('/subject-selection');
            return;
        }
        setSelectedSubject(subject);
        setSelectedCompany(company);
        setCeoImage(img || '');
        setUser(userData);
    }, [navigate]);

    useEffect(() => () => stopCamera(false), []);

    useEffect(() => {
        if (!('FaceDetector' in window)) return;

        try {
            faceDetectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
        } catch {
            faceDetectorRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!cameraEnabled) {
            previousFrameRef.current = null;
            focusHistoryRef.current = [];
            setBehaviorScores((scores) => ({
                ...scores,
                presence: 0,
                eyeContact: 0,
                composure: 0,
            }));
            setBehaviorSummary('Video feedback is off.');
            return undefined;
        }

        const analyzeFrame = async () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (!video || !canvas || video.readyState < 2) return;

            const width = 160;
            const height = 120;
            canvas.width = width;
            canvas.height = height;

            const context = canvas.getContext('2d', { willReadFrequently: true });
            context.drawImage(video, 0, 0, width, height);
            const { data } = context.getImageData(0, 0, width, height);

            let brightness = 0;
            let motion = 0;
            const previousFrame = previousFrameRef.current;

            for (let i = 0; i < data.length; i += 16) {
                const luminance = (data[i] + data[i + 1] + data[i + 2]) / 3;
                brightness += luminance;

                if (previousFrame) {
                    const previousLuminance = (previousFrame[i] + previousFrame[i + 1] + previousFrame[i + 2]) / 3;
                    motion += Math.abs(luminance - previousLuminance);
                }
            }

            const sampleCount = data.length / 16;
            brightness /= sampleCount;
            motion = previousFrame ? motion / sampleCount : 0;
            previousFrameRef.current = new Uint8ClampedArray(data);

            let faceCenteredScore = 45;
            let presenceScore = 72;
            let rawFocusScore = 45;
            let faceCount = 0;
            let headLowered = false;
            let lookingAway = false;
            let multiplePeople = false;
            let noFaceDetected = false;

            if (faceDetectorRef.current) {
                try {
                    const faces = await faceDetectorRef.current.detect(video);
                    faceCount = faces.length;
                    multiplePeople = faceCount > 1;
                    noFaceDetected = faceCount === 0;

                    if (faces[0]) {
                        const box = faces[0].boundingBox;
                        const centerX = box.x + box.width / 2;
                        const centerY = box.y + box.height / 2;
                        const offsetX = Math.abs(centerX - video.videoWidth / 2) / (video.videoWidth / 2);
                        const offsetY = Math.abs(centerY - video.videoHeight / 2) / (video.videoHeight / 2);
                        headLowered = centerY > video.videoHeight * 0.68 || box.y > video.videoHeight * 0.42;
                        lookingAway = offsetX > 0.38 || offsetY > 0.42;
                        const faceSizeRatio = box.width / video.videoWidth;
                        presenceScore = clampScore(45 + Math.min(faceSizeRatio * 110, 45));
                        rawFocusScore = clampScore(
                            100
                            - offsetX * 100
                            - offsetY * 80
                            - (headLowered ? 24 : 0)
                            - (lookingAway ? 30 : 0)
                            - Math.max(motion - 10, 0) * 1.6
                        );
                    } else {
                        presenceScore = 28;
                        rawFocusScore = 12;
                    }
                } catch {
                    faceDetectorRef.current = null;
                }
            } else {
                presenceScore = clampScore(brightness > 35 ? 58 + Math.min(motion, 14) : 22);
                rawFocusScore = clampScore(
                    62
                    - Math.max(motion - 8, 0) * 2.4
                    - (brightness < 55 ? 22 : 0)
                    - (brightness > 215 ? 14 : 0)
                );
            }

            const lightingScore = clampScore(100 - Math.abs(brightness - 130) * 0.75);
            const composureScore = clampScore(92 - Math.max(motion - 8, 0) * 2.8);
            rawFocusScore = clampScore(
                rawFocusScore
                - (noFaceDetected ? 35 : 0)
                - (multiplePeople ? 20 : 0)
                - (lightingScore < 45 ? 10 : 0)
            );
            focusHistoryRef.current = [...focusHistoryRef.current.slice(-3), rawFocusScore];
            faceCenteredScore = clampScore(
                focusHistoryRef.current.reduce((total, score) => total + score, 0) / focusHistoryRef.current.length
            );
            const nextScores = {
                presence: presenceScore,
                lighting: lightingScore,
                eyeContact: faceCenteredScore,
                composure: composureScore,
            };

            const nextFeedback = [];
            const warningMessages = [];

            if (multiplePeople) {
                warningMessages.push('Another person appears to be present. Please stay alone for the interview.');
            }

            if (noFaceDetected) {
                warningMessages.push('Your face is not visible. Return to the camera frame.');
            }

            if (lookingAway) {
                warningMessages.push('Your eyes or face are away from the screen. Look back at the interview window.');
            }

            if (headLowered) {
                warningMessages.push('Your head appears lowered. Raise your head and keep eye level with the camera.');
            }

            if (lightingScore < 58) {
                nextFeedback.push(brightness < 100 ? 'Add more light in front of you.' : 'Reduce glare behind or beside you.');
            } else {
                nextFeedback.push('Lighting looks interview-ready.');
            }

            if (presenceScore < 55) {
                nextFeedback.push('Center your face in the camera frame.');
            } else if (faceCenteredScore < 62) {
                nextFeedback.push('Look closer to the webcam when answering.');
            } else {
                nextFeedback.push('Camera presence is steady.');
            }

            if (composureScore < 60) {
                nextFeedback.push('Slow your movement and settle your posture.');
            } else {
                nextFeedback.push('Posture and movement look composed.');
            }

            if (warningMessages.length) {
                violationStreakRef.current += 1;
            } else {
                violationStreakRef.current = Math.max(0, violationStreakRef.current - 1);
            }

            const confidencePenalty = warningMessages.length * 9 + Math.max(violationStreakRef.current - 1, 0) * 6;
            setConfidenceScore((currentScore) => {
                const nextScore = warningMessages.length
                    ? clampScore(currentScore - confidencePenalty)
                    : clampScore(currentScore + 4);

                if (!interviewPaused && (nextScore <= 35 || violationStreakRef.current >= 3 || multiplePeople)) {
                    const reason = warningMessages[0] || 'Interview attention dropped below the allowed threshold.';
                    window.setTimeout(() => triggerInterviewPause(reason), 0);
                }

                return nextScore;
            });
            setProctorWarnings(warningMessages);

            const summary = [
                `presence ${scoreLabel(nextScores.presence)} (${nextScores.presence}/100)`,
                `lighting ${scoreLabel(nextScores.lighting)} (${nextScores.lighting}/100)`,
                `camera focus ${scoreLabel(nextScores.eyeContact)} (${nextScores.eyeContact}/100)`,
                `composure ${scoreLabel(nextScores.composure)} (${nextScores.composure}/100)`,
                `confidence ${confidenceScore}/100`,
                warningMessages.length ? `active warnings: ${warningMessages.join(' ')}` : 'active warnings: none',
                faceDetectorRef.current ? `detected faces: ${faceCount}` : 'face detection unavailable; using visual stability signals',
                `current tips: ${nextFeedback.join(' ')}`,
            ].join('; ');

            setBehaviorScores(nextScores);
            setBehaviorFeedback(nextFeedback);
            setBehaviorSummary(summary);
        };

        const interval = window.setInterval(analyzeFrame, 1800);
        analyzeFrame();

        return () => window.clearInterval(interval);
    }, [cameraEnabled, confidenceScore, interviewPaused, listening]);

    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript]);

    const toggleListening = () => {
        if (listening) {
            SpeechRecognition.stopListening();
        } else {
            resetTranscript();
            SpeechRecognition.startListening({ continuous: true });
        }
    };

    useEffect(() => {
        const startInterview = async () => {
            if (!selectedSubject) return;

            const companyMode = selectedCompany && selectedCompany !== 'General'
                ? `${selectedCompany}-style interview based on public preparation patterns`
                : 'general interview';
            const welcomeMsg = `Hi ${user.username || 'there'}! Welcome to your ${companyMode}. I'm your AI coach, and I'll ask realistic questions one at a time. Are you ready to begin?`;
            setMessages([{ role: 'assistant', content: welcomeMsg }]);
            setLastReply(welcomeMsg);
        };
        startInterview();
    }, [selectedSubject, selectedCompany, user.username]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (interviewPaused) {
            setError('Interview is paused. Confirm the warning before continuing.');
            return;
        }
        if (!input.trim()) return;

        if (listening) {
            SpeechRecognition.stopListening();
        }

        const newMessages = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
        resetTranscript();

        try {
            const res = await chatAPI.interact(newMessages, selectedSubject, selectedCompany, behaviorSummary);
            const aiReply = res.data.reply;
            setMessages([...newMessages, { role: 'assistant', content: aiReply }]);
            setLastReply(res.data.speech_text || aiReply);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to get response from AI coach.');
        }
    };

    const finishInterview = async () => {
        const userMessages = messages.filter(m => m.role === 'user');
        if (userMessages.length < requiredResponses) {
            setError(`Please complete at least ${requiredResponses} responses before finishing. You have completed ${userMessages.length} responses.`);
            return;
        }

        try {
            const res = await chatAPI.save(JSON.stringify(messages), selectedSubject);
            navigate(`/feedback/${res.data.id}`);
        } catch (err) {
            console.error(err);
            setError('Unable to save the interview.');
        }
    };

    return (
        <div className="flex h-[calc(100vh-120px)] flex-col overflow-hidden animate-fadeIn">
            <div className={`mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-5 overflow-hidden px-2 py-2 transition-all duration-500 lg:flex-row ${interviewPaused ? 'blur-md pointer-events-none select-none' : ''}`}>
                <aside className="grid shrink-0 grid-cols-1 gap-4 overflow-y-auto pr-2 sm:grid-cols-3 lg:h-full lg:w-96 lg:grid-cols-1 lg:content-start lg:pr-2">
                    <section className="glass-card hover-glow relative flex min-h-72 flex-col overflow-hidden rounded-2xl border border-slate-200 p-4 shadow-lg dark:border-white/10 lg:min-h-72">
                        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-sky-500/10 via-transparent to-transparent"></div>
                        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white/70 p-3 text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
                            <div className="grid h-44 w-full place-items-center overflow-visible">
                                <div className="scale-[0.58]">
                                    <AvatarSpeaker isSpeaking={isSpeaking} onSpeakStateChange={setIsSpeaking} text={lastReply} image={ceoImage} />
                                </div>
                            </div>
                            <div className="mt-1 text-center">
                                <h2 className="text-xs font-black uppercase tracking-[0.22em]">AI Oracle</h2>
                                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                                    Speaking AI
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="glass-panel hover-glow flex min-h-[360px] flex-col rounded-2xl border border-slate-200 p-4 dark:border-white/10 lg:min-h-[390px]">
                        <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white/70 p-4 text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-sky-500">Live Video Coach</h3>
                                    <p className="mt-1 text-[8px] font-black uppercase tracking-widest text-slate-500">Camera & details</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleCamera}
                                    className={`grid h-10 w-10 place-items-center rounded-xl transition-all ${
                                        cameraEnabled ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.35)]' : 'bg-slate-100 text-slate-600 hover:text-slate-950 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white'
                                    }`}
                                    title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
                                >
                                    {cameraEnabled ? <CameraOff size={18} /> : <Camera size={18} />}
                                </button>
                            </div>

                            <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-white/10 lg:aspect-[16/10]">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className={`h-full w-full object-cover transition-opacity duration-500 ${cameraEnabled ? 'opacity-100' : 'opacity-25'}`}
                                />
                                <canvas ref={canvasRef} className="hidden" />
                                {!cameraEnabled && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
                                        <Camera size={24} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Video Paused</span>
                                    </div>
                                )}
                                {cameraEnabled && (
                                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-[8px] font-black uppercase text-white shadow-lg">
                                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                                        Live
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-[10px] font-black uppercase">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/5 dark:bg-white/5">
                                    <span className="block text-slate-500">Confidence</span>
                                    <span className="text-2xl text-slate-950 dark:text-white">{confidenceScore}</span>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${getConfidenceColor(confidenceScore)}`}
                                            style={{ width: `${confidenceScore}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/5 dark:bg-white/5">
                                    <span className="block text-slate-500">Focus</span>
                                    <span className="text-2xl text-slate-950 dark:text-white">{behaviorScores.eyeContact}</span>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${getConfidenceColor(behaviorScores.eyeContact)}`}
                                            style={{ width: `${behaviorScores.eyeContact}%` }}
                                        ></div>
                                    </div>
                                    <span className="mt-1 block text-[8px] font-black uppercase tracking-widest text-slate-500">
                                        {scoreLabel(behaviorScores.eyeContact)}
                                    </span>
                                </div>
                            </div>
                            {cameraError && (
                                <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-[9px] font-black uppercase leading-tight text-rose-500">
                                    {cameraError}
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="glass-panel hover-glow flex min-h-72 flex-col rounded-2xl border border-slate-200 p-4 dark:border-white/10 lg:min-h-80">
                        <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white/70 p-3 text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-sky-500">Mission Status</h3>
                            <div className="mt-3 space-y-2">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-white/5 dark:bg-white/5">
                                    <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Protocol</span>
                                    <span className="mt-1 block truncate text-sm font-black capitalize">{selectedSubject.replace('_', ' ')}</span>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-white/5 dark:bg-white/5">
                                    <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Company</span>
                                    <span className="mt-1 block truncate text-sm font-black text-sky-600 dark:text-sky-300">{selectedCompany}</span>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-white/5 dark:bg-white/5">
                                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                                        <span>Progress</span>
                                        <span className="text-slate-950 dark:text-white">{messages.filter(m => m.role === 'user').length}/{requiredResponses}</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                                        <div className="h-full rounded-full bg-sky-500 transition-all duration-500" style={{ width: `${Math.min((messages.filter(m => m.role === 'user').length / requiredResponses) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto scrollbar-hide">
                                {proctorWarnings.map((item) => (
                                    <div key={item} className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1.5 text-[9px] font-black leading-tight text-rose-500">
                                        {item}
                                    </div>
                                ))}
                                {behaviorFeedback.map((item) => (
                                    <div key={item} className="rounded-lg bg-slate-50 px-2 py-1.5 text-[9px] font-bold leading-tight text-slate-600 dark:bg-white/5 dark:text-slate-300">
                                        {item}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={finishInterview}
                                className="mt-3 w-full shrink-0 rounded-lg border border-rose-500/20 bg-rose-500/10 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
                            >
                                Abort
                            </button>
                        </div>
                    </section>
                </aside>

                <section className="glass-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-[3rem] border border-slate-200 p-5 shadow-[0_48px_100px_-24px_rgba(15,23,42,0.16)] dark:border-white/10 dark:shadow-[0_48px_100px_-24px_rgba(0,0,0,0.5)]">
                    <div className="mb-4 flex shrink-0 items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
                        <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.25)]">
                                <Mic size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest">Neural Console</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Scrollable interview stream</p>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white/80 p-5 text-slate-950 scrollbar-hide dark:border-white/10 dark:bg-slate-950/30 dark:text-white">
                        {messages.map((m, i) => (
                            <div key={i} className={`mb-5 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeInUp`} style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className={`max-w-[85%] rounded-[1.5rem] p-5 text-sm font-semibold leading-relaxed shadow-xl ${
                                    m.role === 'user'
                                        ? 'rounded-tr-none bg-sky-500 text-white'
                                        : 'rounded-tl-none border border-slate-200 bg-slate-50 text-slate-800 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200'
                                }`}>
                                    <div className={`mb-2 text-[9px] font-black uppercase tracking-widest ${m.role === 'user' ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {m.role === 'user' ? 'You' : 'AI Interviewer'}
                                    </div>
                                    <div>
                                        <MessageContent content={m.content} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {error && (
                            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold text-center uppercase tracking-widest">
                                {error}
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="mt-4 shrink-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                        <form onSubmit={handleSend} className="flex gap-3">
                            <button
                                type="button"
                                onClick={toggleListening}
                                disabled={interviewPaused}
                                className={`grid h-12 w-12 place-items-center rounded-2xl transition-all ${
                                    listening ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'glass-panel text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                                } disabled:opacity-40`}
                            >
                                {listening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your answer..."
                                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-950 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500/50 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || interviewPaused}
                                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-sky-500 px-5 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all hover:bg-sky-600 disabled:opacity-50 disabled:grayscale"
                            >
                                <Send size={16} />
                                Send
                            </button>
                        </form>
                    </div>
                </section>
            </div>
            {interviewPaused && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-6 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-[2rem] border border-rose-500/30 bg-white p-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)] dark:bg-slate-950">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                            <AlertTriangle size={30} />
                        </div>
                        <div className="mt-6 space-y-3 text-center">
                            <h2 className="text-2xl font-black uppercase tracking-widest text-slate-950 dark:text-white">Interview Paused</h2>
                            <p className="text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">
                                {pauseReason || 'The video coach detected an interview behavior warning.'}
                            </p>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                Do you want to continue the interview now?
                            </p>
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={stopFlaggedInterview}
                                className="h-14 rounded-2xl border border-slate-200 bg-slate-100 text-xs font-black uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                                No
                            </button>
                            <button
                                type="button"
                                onClick={resumeInterview}
                                className="h-14 rounded-2xl bg-sky-500 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_24px_rgba(56,189,248,0.35)] transition-all hover:bg-sky-600"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Interview;
