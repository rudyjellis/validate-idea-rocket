import { useRef, useState, useEffect } from 'react';
import { createVideoRecorderLogger } from '@/utils/logger';

const log = createVideoRecorderLogger('useRecordingTimer');

export const useRecordingTimer = (maxDuration: number = 30, onTimeExpired?: () => void) => {
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    log.log("Starting timer with maxDuration:", maxDuration);
    startTimeRef.current = Date.now();
    
    const updateTimer = () => {
      const elapsed = (Date.now() - (startTimeRef.current || Date.now())) / 1000;
      const remaining = Math.max(0, maxDuration - elapsed);
      setTimeLeft(Math.ceil(remaining));

      if (remaining <= 0) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        // Call the callback when time expires
        if (onTimeExpired) {
          onTimeExpired();
        }
      } else {
        // Continue the animation loop
        animationFrameRef.current = requestAnimationFrame(updateTimer);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(updateTimer);
  };

  const stopTimer = () => {
    log.log("Stopping timer");
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;
  };

  const pauseTimer = () => {
    log.log("Pausing timer");
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const resetTimer = () => {
    log.log("Resetting timer");
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