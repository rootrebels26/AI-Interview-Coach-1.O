import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * High-quality Natural Voice Selector.
 * Prioritizes modern Neural/Natural voices (Edge/Windows Natural, Google Studio, Apple Enhanced)
 * over outdated robotic desktop synthesizers.
 */
function pickBestNaturalVoice(availableVoices) {
  if (!availableVoices || availableVoices.length === 0) return null;

  // 1. Edge / Windows Online Neural Natural Voices (most human-like on Windows)
  const neuralVoice = availableVoices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.includes('Natural') || v.name.includes('Neural')) &&
      !v.name.includes('Desktop')
  );
  if (neuralVoice) return neuralVoice;

  // 2. Google High-Fidelity Voices (Chrome)
  const googleVoice = availableVoices.find(
    (v) =>
      v.name.includes('Google US English') ||
      v.name.includes('Google UK English Female') ||
      v.name.includes('Google UK English Male')
  );
  if (googleVoice) return googleVoice;

  // 3. Apple Enhanced Voices (Safari / macOS)
  const enhancedVoice = availableVoices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.includes('Enhanced') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Karen'))
  );
  if (enhancedVoice) return enhancedVoice;

  // 4. Any clean modern English (US/GB) voice (excluding robotic SAPI5 desktop voices if possible)
  const modernEnUS = availableVoices.find(
    (v) => (v.lang === 'en-US' || v.lang === 'en-GB') && !v.name.includes('Desktop')
  );
  if (modernEnUS) return modernEnUS;

  // 5. Fallback to any English voice
  const anyEnglish = availableVoices.find((v) => v.lang.startsWith('en'));
  return anyEnglish || availableVoices[0];
}

/**
 * Phonetically cleans text to sound warm, natural, and conversational when spoken.
 */
function prepareTextForNaturalSpeech(text) {
  if (!text) return '';

  return (
    text
      // Remove code blocks and inline code fences
      .replace(/```[\s\S]*?```/g, 'Code example omitted.')
      .replace(/`([^`]+)`/g, '$1')
      // Remove question prefixes (e.g. "Q1:", "Question 2:")
      .replace(/\bQ\d+[:.]?\s*/gi, '')
      .replace(/\bQuestion\s+\d+[:.]?\s*/gi, '')
      // Smooth technical abbreviations for clear pronunciation
      .replace(/\bCI\/CD\b/gi, 'C I C D')
      .replace(/\bAPI\b/g, 'A P I')
      .replace(/\bAPIs\b/g, 'A P I s')
      .replace(/\bUI\/UX\b/gi, 'U I U X')
      .replace(/\bNoSQL\b/gi, 'No S Q L')
      .replace(/\bRESTful\b/gi, 'Rest ful')
      .replace(/\bvs\b/gi, 'versus')
      .replace(/—/g, ', ')
      // Clean markdown tags, asterisks, brackets, and bullet symbols
      .replace(/[*_#~>•\-\[\]\(\)]/g, ' ')
      // Remove non-ascii emojis
      .replace(/[^\x00-\x7F]/g, '')
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

export default function useSpeechSynthesis() {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const lastSpokenTextRef = useRef('');
  const keepAliveTimerRef = useRef(null);

  // Load available browser voices with high-quality preference
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available && available.length > 0) {
        setVoices(available);
        const best = pickBestNaturalVoice(available);
        if (best) {
          setSelectedVoice(best);
        }
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  const clearKeepAlive = () => {
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }
  };

  const stop = useCallback(() => {
    clearKeepAlive();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text) => {
      if (!voiceEnabled || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }

      stop();

      const naturalText = prepareTextForNaturalSpeech(text);
      if (!naturalText) return;

      lastSpokenTextRef.current = text;

      const utterance = new SpeechSynthesisUtterance(naturalText);

      // Select voice: user choice -> best natural voice -> default
      const currentVoices = window.speechSynthesis.getVoices();
      const voiceToUse = selectedVoice || pickBestNaturalVoice(currentVoices) || currentVoices[0];
      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }

      // Natural Human Pacing: 0.98 is relaxed, clear, and confident (avoiding rushed 1.05+ chipmunk tempo)
      utterance.rate = 0.98;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        // Chrome bug workaround: keep synthesis alive for utterances longer than 14 seconds
        clearKeepAlive();
        keepAliveTimerRef.current = setInterval(() => {
          if (window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          } else {
            clearKeepAlive();
          }
        }, 12000);
      };

      utterance.onend = () => {
        clearKeepAlive();
        setIsSpeaking(false);
      };

      utterance.onerror = (e) => {
        clearKeepAlive();
        console.warn('Natural SpeechSynthesis note:', e);
        setIsSpeaking(false);
      };

      // Resume context if paused before speaking
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled, selectedVoice, stop]
  );

  const replay = useCallback(() => {
    if (lastSpokenTextRef.current) {
      speak(lastSpokenTextRef.current);
    }
  }, [speak]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearKeepAlive();
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
