import { useState, useRef, useCallback, useEffect } from 'react';
import interviewApi from '../services/interviewApi';

export default function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [micError, setMicError] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const isRecordingRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const whisperTimeoutRef = useRef(null);

  // Initialize SpeechRecognition if available in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          // Strictly drop any speech recognition events if recording is stopped or inactive
          if (!isRecordingRef.current) {
            return;
          }
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          if (isRecordingRef.current) {
            setTranscript(currentTranscript.trim());
          }
        };

        recognition.onerror = (event) => {
          console.warn('SpeechRecognition error:', event.error);
          if (event.error === 'not-allowed') {
            setMicError('Microphone permission was denied. Please allow microphone access or type your answer.');
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (whisperTimeoutRef.current) clearTimeout(whisperTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  const clearTranscript = useCallback(() => {
    if (whisperTimeoutRef.current) {
      clearTimeout(whisperTimeoutRef.current);
      whisperTimeoutRef.current = null;
    }
    audioChunksRef.current = [];
    setTranscript('');
    setRecordingDuration(0);
  }, []);

  const startRecording = useCallback(async () => {
    // Immediately cancel any AI speech synthesis so the microphone never transcribes the AI's voice!
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    if (whisperTimeoutRef.current) {
      clearTimeout(whisperTimeoutRef.current);
      whisperTimeoutRef.current = null;
    }

    setMicError('');
    audioChunksRef.current = [];
    setRecordingDuration(0);
    setTranscript('');
    isRecordingRef.current = true;

    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && isRecordingRef.current) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // 3. Start Browser SpeechRecognition if supported
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (_) {}
      }
    } catch (err) {
      console.error('Microphone access failed:', err);
      isRecordingRef.current = false;
      setIsRecording(false);
      setMicError(
        'Microphone is unavailable or access was denied. You can comfortably type your answer in the box below.'
      );
    }
  }, []);

  const stopRecording = useCallback(async (options = {}) => {
    const { skipWhisper = false, cancel = false } = options || {};
    isRecordingRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (whisperTimeoutRef.current) {
      clearTimeout(whisperTimeoutRef.current);
      whisperTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        if (cancel) {
          recognitionRef.current.abort();
        } else {
          recognitionRef.current.stop();
        }
      } catch (_) {}
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
        recorder.stream.getTracks().forEach((track) => track.stop());
      } catch (_) {}
    }

    setIsRecording(false);

    if (skipWhisper || cancel) {
      audioChunksRef.current = [];
      return;
    }

    // Fallback: If transcript is empty and we captured audio chunks, send to Whisper
    whisperTimeoutRef.current = setTimeout(async () => {
      if (!isRecordingRef.current && !transcript.trim() && audioChunksRef.current.length > 0) {
        setIsTranscribing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('file', audioBlob, 'recording.webm');
          const resp = await interviewApi.transcribe(formData);
          if (resp.data && resp.data.transcript && whisperTimeoutRef.current !== null) {
            setTranscript(resp.data.transcript.trim());
          }
        } catch (whisperErr) {
          console.warn('Server whisper transcription fallback note:', whisperErr);
        } finally {
          setIsTranscribing(false);
          audioChunksRef.current = [];
        }
      }
    }, 400);
  }, [transcript]);

  return {
    isRecording,
    transcript,
    setTranscript,
    micError,
    isTranscribing,
    recordingDuration,
    startRecording,
    stopRecording,
    clearTranscript,
  };
}
