import { useState, useEffect, useRef, useCallback } from 'react';

// Keywords to identify male voices across Windows, Edge, Chrome, macOS, Android
const MALE_KEYWORDS = [
  'guy',
  'christopher',
  'david',
  'mark',
  'george',
  'ryan',
  'liam',
  'daniel',
  'alex',
  'fred',
  'oliver',
  'stefan',
  'james',
  'brian',
  'andrew',
  'male',
  'uk english male',
];

// Keywords to identify female voices across Windows, Edge, Chrome, macOS, Android
const FEMALE_KEYWORDS = [
  'jenny',
  'aria',
  'ava',
  'zira',
  'sonia',
  'emma',
  'michelle',
  'samantha',
  'victoria',
  'karen',
  'moira',
  'tessa',
  'cathy',
  'serena',
  'female',
  'uk english female',
  'google us english',
];

/**
 * Robust gender-specific voice selector.
 * Finds high-fidelity Natural/Neural/Google/Apple voices matching the requested gender.
 */
export function pickVoiceForGender(availableVoices, gender = 'male') {
  if (!availableVoices || availableVoices.length === 0) return null;

  const englishVoices = availableVoices.filter(
    (v) => v.lang && v.lang.toLowerCase().startsWith('en')
  );
  const voicePool = englishVoices.length > 0 ? englishVoices : availableVoices;

  const isMale = gender === 'male';
  const targetKeywords = isMale ? MALE_KEYWORDS : FEMALE_KEYWORDS;
  const oppositeKeywords = isMale ? FEMALE_KEYWORDS : MALE_KEYWORDS;

  // 1. High-Quality Online Natural / Neural voice matching target gender
  const neuralMatch = voicePool.find((v) => {
    const nameLower = v.name.toLowerCase();
    const hasTarget = targetKeywords.some((kw) => nameLower.includes(kw));
    const hasOpposite = oppositeKeywords.some((kw) => nameLower.includes(kw));
    const isNatural = nameLower.includes('natural') || nameLower.includes('neural');
    return hasTarget && !hasOpposite && isNatural;
  });
  if (neuralMatch) return neuralMatch;

  // 2. Google High-Fidelity Voice matching target gender
  const googleMatch = voicePool.find((v) => {
    const nameLower = v.name.toLowerCase();
    const hasTarget = targetKeywords.some((kw) => nameLower.includes(kw));
    const hasOpposite = oppositeKeywords.some((kw) => nameLower.includes(kw));
    return hasTarget && !hasOpposite && nameLower.includes('google');
  });
  if (googleMatch) return googleMatch;

  // 3. Apple Enhanced or OS standard voice matching target gender (e.g. David / Zira)
  const standardMatch = voicePool.find((v) => {
    const nameLower = v.name.toLowerCase();
    const hasTarget = targetKeywords.some((kw) => nameLower.includes(kw));
    const hasOpposite = oppositeKeywords.some((kw) => nameLower.includes(kw));
    return hasTarget && !hasOpposite;
  });
  if (standardMatch) return standardMatch;

  // 4. Fallback: Any voice without opposite keywords
  const looseMatch = voicePool.find((v) => {
    const nameLower = v.name.toLowerCase();
    return !oppositeKeywords.some((kw) => nameLower.includes(kw));
  });
  if (looseMatch) return looseMatch;

  // 5. Absolute fallback
  return voicePool[0];
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

export default function useSpeechSynthesis(initialGender = 'male') {
  const [voices, setVoices] = useState([]);
  const [gender, setGenderState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nitya_tts_gender') || initialGender;
    }
    return initialGender;
  });
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const lastSpokenTextRef = useRef('');
  const keepAliveTimerRef = useRef(null);
  const fallbackTimeoutRef = useRef(null);
  const pendingUtteranceRef = useRef(null);

  // Sync selected voice whenever available voices or gender change
  const refreshVoice = useCallback((available, targetGender) => {
    if (!available || available.length === 0) return null;
    const best = pickVoiceForGender(available, targetGender);
    if (best) {
      setSelectedVoice(best);
      return best;
    }
    return null;
  }, []);

  // Load available browser voices with gender awareness
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available && available.length > 0) {
        setVoices(available);
        refreshVoice(available, gender);
        // If an utterance was queued while voices were initializing, execute it now
        if (pendingUtteranceRef.current) {
          const { text: queuedText, overrideVoice: qVoice, overrideGender: qGen } = pendingUtteranceRef.current;
          pendingUtteranceRef.current = null;
          speak(queuedText, qVoice, qGen);
        }
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, [gender, refreshVoice]);

  // Set gender and instantly pick the corresponding male or female voice
  const setGender = useCallback(
    (newGender) => {
      setGenderState(newGender);
      try {
        localStorage.setItem('nitya_tts_gender', newGender);
      } catch (_) {}

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const available = window.speechSynthesis.getVoices();
        const newVoice = refreshVoice(available, newGender);
        // Stop current speech so new voice takes effect immediately
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        }
        return newVoice;
      }
      return null;
    },
    [refreshVoice]
  );

  const selectVoiceByName = useCallback(
    (voiceName) => {
      const found = voices.find((v) => v.name === voiceName);
      if (found) {
        setSelectedVoice(found);
      }
    },
    [voices]
  );

  const clearKeepAlive = () => {
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }
  };

  const stop = useCallback(() => {
    clearKeepAlive();
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text, overrideVoice = null, overrideGender = null) => {
      if (!voiceEnabled || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }

      // If browser hasn't populated voices yet, remember this prompt so it speaks as soon as voices load
      const currentVoices = window.speechSynthesis.getVoices();
      if (!currentVoices || currentVoices.length === 0) {
        pendingUtteranceRef.current = { text, overrideVoice, overrideGender };
      }

      clearKeepAlive();
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }

      const naturalText = prepareTextForNaturalSpeech(text);
      if (!naturalText) return;

      lastSpokenTextRef.current = text;

      const utterance = new SpeechSynthesisUtterance(naturalText);
      const activeGender = overrideGender || gender;

      // Select voice: override -> selectedVoice -> auto-pick by gender -> fallback
      const voiceToUse =
        overrideVoice ||
        selectedVoice ||
        pickVoiceForGender(currentVoices, activeGender) ||
        (currentVoices && currentVoices[0]);

      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }

      // Gender-tailored acoustic parameters:
      // Male (Alex): pitch 0.94, rate 0.97 for deep authoritative resonance
      // Female (Elena): pitch 1.12, rate 0.98 for crisp, warm, melodic tone
      if (activeGender === 'female') {
        utterance.pitch = 1.12;
        utterance.rate = 0.98;
      } else {
        utterance.pitch = 0.94;
        utterance.rate = 0.97;
      }
      utterance.volume = 1.0;

      // Immediately activate face movement and talking animation
      setIsSpeaking(true);

      // Estimated duration based on words (avg ~2.3 words/sec) + 4s buffer
      const wordCount = naturalText.split(/\s+/).filter(Boolean).length || 10;
      const estimatedDurationMs = Math.max(3500, Math.round((wordCount / 2.3) * 1000) + 4000);
      fallbackTimeoutRef.current = setTimeout(() => {
        setIsSpeaking(false);
      }, estimatedDurationMs);

      utterance.onstart = () => {
        setIsSpeaking(true);
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
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current);
          fallbackTimeoutRef.current = null;
        }
        setIsSpeaking(false);
      };

      utterance.onerror = (e) => {
        clearKeepAlive();
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current);
          fallbackTimeoutRef.current = null;
        }
        console.warn('SpeechSynthesis note:', e);
        setIsSpeaking(false);
      };

      const executeUtterance = () => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('SpeechSynthesis execution error:', err);
        }
      };

      // Workaround for Chromium Bug #637248: calling cancel() and speak() in the same tick cancels the utterance.
      // If currently speaking, cancel and delay by 40ms to let Chromium cancel IPC clear safely; otherwise speak immediately.
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
        setTimeout(executeUtterance, 40);
      } else {
        executeUtterance();
      }
    },
    [voiceEnabled, selectedVoice, gender]
  );

  // Quick test voice audio phrase
  const testVoice = useCallback(
    (sampleText = null, targetGender = null, targetVoice = null) => {
      const activeGen = targetGender || gender;
      const defaultPhrase =
        activeGen === 'female'
          ? "Hello! I am Elena Rostova. I will be conducting your interview today."
          : "Hello! I am Alex Vance. I will be conducting your interview today.";
      speak(sampleText || defaultPhrase, targetVoice, activeGen);
    },
    [gender, speak]
  );

  const replay = useCallback(
    (optionalText = null) => {
      const textToPlay = optionalText || lastSpokenTextRef.current;
      if (textToPlay) {
        speak(textToPlay);
      }
    },
    [speak]
  );

  useEffect(() => {
    return () => {
      clearKeepAlive();
      stop();
    };
  }, [stop]);

  return {
    voices,
    gender,
    setGender,
    selectedVoice,
    setSelectedVoice,
    selectVoiceByName,
    isSpeaking,
    voiceEnabled,
    setVoiceEnabled,
    speak,
    replay,
    testVoice,
    stop,
  };
}
