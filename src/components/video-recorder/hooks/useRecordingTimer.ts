import { useState, useRef, useEffect } from "react";
import type { RecordingState } from "../types";

export const useRecordingTimer = (recordingState: RecordingState, maxDuration: number = 30) => {
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    console.log("Timer state changed:", recordingState, "Time left:", timeLeft);

    const updateTimer = () => {
      if (!startTimeRef.current) return;
      
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const newTimeLeft = Math.max(0, maxDuration - elapsed);
      
      console.log("Timer update - Elapsed:", elapsed, "New time left:", newTimeLeft);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft <= 0) {
        console.log("Timer reached zero");
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    if (recordingState === "recording") {
      console.log("Starting timer interval");
      // Clear any existing interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set start time if not already set
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      // Update immediately and then start interval
      updateTimer();
      intervalRef.current = setInterval(updateTimer, 1000);
    } else {
      console.log("Clearing timer interval");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Reset timer and start time when returning to idle state
      if (recordingState === "idle") {
        console.log("Resetting timer to max duration:", maxDuration);
        startTimeRef.current = null;
        setTimeLeft(maxDuration);
      }
    }

    return () => {
      console.log("Cleaning up timer interval");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [recordingState, maxDuration]);

  const resetTimer = () => {
    console.log("Manually resetting timer");
    startTimeRef.current = null;
    setTimeLeft(maxDuration);
  };

  return { timeLeft, resetTimer };
};