import { useState, useRef, useEffect } from "react";
import type { RecordingState } from "../types";

export const useRecordingTimer = (recordingState: RecordingState, maxDuration: number = 30) => {
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("Timer state changed:", recordingState, "Time left:", timeLeft);

    if (recordingState === "recording") {
      console.log("Starting timer interval");
      // Clear any existing interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          console.log("Timer tick:", newTime);
          
          if (newTime <= 0) {
            console.log("Timer reached zero");
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      console.log("Clearing timer interval");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Reset timer when returning to idle state
      if (recordingState === "idle") {
        console.log("Resetting timer to max duration:", maxDuration);
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
    setTimeLeft(maxDuration);
  };

  return { timeLeft, resetTimer };
};