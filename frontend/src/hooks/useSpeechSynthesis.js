import { useState, useEffect, useRef, useCallback } from 'react';

export default function useSpeechSynthesis() {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const lastSpokenTextRef = useRef('');

  // Load available browser voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
        // Default to high quality English voice (Google US English, Samantha, Microsoft Zira/David)
        const preferred =
          available.find((v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))) ||
          available.find((v) => v.lang.startsWith('en-US')) ||
          available.find((v) => v.lang.startsWith('en')) ||
          available[0];
        setSelectedVoice(preferred);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text) => {
      if (!voiceEnabled || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }

      try {
        window.speechSynthesis.cancel();
      } catch (_) {}

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      lastSpokenTextRef.current = text;

      // Clean markdown tags, emojis, and code fences for clear voice delivery
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'Code example omitted.')
        .replace(/[*_#`~>]/g, '')
        .replace(/[^\x00-\x7F]/g, '') // remove non-ascii emojis
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Choose best natural English voice available
      const currentVoices = window.speechSynthesis.getVoices();
      const voiceToUse = selectedVoice ||
        currentVoices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Online'))) ||
        currentVoices.find((v) => v.lang.startsWith('en')) ||
        currentVoices[0];

      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setIsSpeaking(false);
      };

      // Bugfix for Chrome: resume synthesis before speaking
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled, selectedVoice]
  );

  const replay = useCallback(() => {
    if (lastSpokenTextRef.current) {
      speak(lastSpokenTextRef.current);
    }
  }, [speak]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    voices,
    selectedVoice,
    setSelectedVoice,
    isSpeaking,
    voiceEnabled,
    setVoiceEnabled,
    speak,
    replay,
    stop,
  };
}
