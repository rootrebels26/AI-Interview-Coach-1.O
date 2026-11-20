import { createContext, useContext, useState, useEffect } from 'react';

const InterviewContext = createContext(null);

const STORAGE_KEY = 'ai_interview_coach_session';

export function InterviewProvider({ children }) {
  const [config, setConfig] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.config || null;
      }
    } catch (_) {}
    return null;
  });

  const [resumeData, setResumeData] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.resumeData || null;
      }
    } catch (_) {}
    return null;
  });

  const [interviewSession, setInterviewSession] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.interviewSession || null;
      }
    } catch (_) {}
    return null;
  });

  const [finalReport, setFinalReport] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.finalReport || null;
      }
    } catch (_) {}
    return null;
  });

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('nitya_theme') || 'nitya-light';
    } catch (_) {
      return 'nitya-light';
    }
  });

  const AUTH_STORAGE_KEY = 'nitya_interview_auth';

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'granted';
    } catch (_) {
      return false;
    }
  });

  const authenticate = (password) => {
    if (!password) return false;
    const clean = password.trim();
    if (
      clean === 'NityaCloudtech#2024' ||
      clean === 'NityaCloudTech#2024' ||
      clean.toLowerCase() === 'nityacloudtech#2024'
    ) {
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, 'granted');
      } catch (_) {}
      return true;
    }
    return false;
  };

  const lockApp = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (_) {}
  };

  // Apply theme class to document root
  useEffect(() => {
    try {
      localStorage.setItem('nitya_theme', theme);
      if (theme === 'nitya-dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (_) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'nitya-light' ? 'nitya-dark' : 'nitya-light'));
  };

  // Sync to sessionStorage for temporary browser-tab persistence
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          config,
          resumeData,
          interviewSession,
          finalReport,
        })
      );
    } catch (_) {}
  }, [config, resumeData, interviewSession, finalReport]);

  const resetSession = () => {
    setConfig(null);
    setResumeData(null);
    setInterviewSession(null);
    setFinalReport(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  };

  return (
    <InterviewContext.Provider
      value={{
        config,
        setConfig,
        resumeData,
        setResumeData,
        interviewSession,
        setInterviewSession,
        finalReport,
        setFinalReport,
        resetSession,
        theme,
        setTheme,
        toggleTheme,
        isAuthenticated,
        authenticate,
        lockApp,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
}
