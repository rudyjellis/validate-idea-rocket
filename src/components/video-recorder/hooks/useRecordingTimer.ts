import { useRef, useState, useEffect } from 'react';

export const useRecordingTimer = (maxDuration: number = 30) => {
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    console.log("Starting timer with maxDuration:", maxDuration);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
      const remaining = Math.max(0, maxDuration - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    }, 1000);
  };

  const stopTimer = () => {
    console.log("Stopping timer");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = null;
  };

  const pauseTimer = () => {
    console.log("Pausing timer");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetTimer = () => {
    console.log("Resetting timer");
    stopTimer();
    setTimeLeft(maxDuration);
  };

  return {
    timeLeft,
    startTimer,
    stopTimer,
    pauseTimer,
    resetTimer
  };
};