import { useState, useEffect, useCallback } from 'react';

export default function useTabDetection() {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [lastSwitchTime, setLastSwitchTime] = useState(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        setShowWarning(true);
        setLastSwitchTime(new Date().toLocaleTimeString());
      }
    };

    const handleWindowBlur = () => {
      // Optional blur check when window loses focus
      if (!document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        setShowWarning(true);
        setLastSwitchTime(new Date().toLocaleTimeString());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
  }, []);

  return {
    tabSwitchCount,
    showWarning,
    lastSwitchTime,
    dismissWarning,
  };
}
