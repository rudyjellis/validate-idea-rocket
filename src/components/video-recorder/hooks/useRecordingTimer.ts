import { useRef, useState, useEffect } from 'react';
import { createVideoRecorderLogger } from '@/utils/logger';

const log = createVideoRecorderLogger('useRecordingTimer');

export const useRecordingTimer = (maxDuration: number = 30, onTimeExpired?: () => void) => {
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const elapsedTimeRef = useRef<number>(0); // Track total elapsed time

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    log.log("Starting timer with maxDuration:", maxDuration, "elapsed:", elapsedTimeRef.current);
    startTimeRef.current = Date.now();
    
    const updateTimer = () => {
      const currentElapsed = (Date.now() - (startTimeRef.current || Date.now())) / 1000;
      const totalElapsed = elapsedTimeRef.current + currentElapsed;
      const remaining = Math.max(0, maxDuration - totalElapsed);
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
    elapsedTimeRef.current = 0; // Reset elapsed time on stop
  };

  const pauseTimer = () => {
    log.log("Pausing timer at timeLeft:", timeLeft);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    // Save the elapsed time when pausing
    if (startTimeRef.current) {
      const currentElapsed = (Date.now() - startTimeRef.current) / 1000;
      elapsedTimeRef.current += currentElapsed;
      log.log("Total elapsed time:", elapsedTimeRef.current);
    }
    startTimeRef.current = null;
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