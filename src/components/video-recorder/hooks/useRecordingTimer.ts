import { useRef, useState, useEffect } from 'react';
import type { RecordingState } from '../types';

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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = null;
    setTimeLeft(maxDuration);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return {
    timeLeft,
    startTimer,
    stopTimer,
    pauseTimer,
  };
};