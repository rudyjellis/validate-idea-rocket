import { useState, useRef, useEffect } from "react";
import type { RecordingState } from "../types";

export const useRecordingTimer = (recordingState: RecordingState) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (recordingState === "recording") {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          setTimeLeft((prevTime) => {
            if (prevTime <= 1) {
              clearInterval(intervalRef.current);
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
      }
    } else if (recordingState === "paused") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [recordingState]);

  const resetTimer = () => setTimeLeft(30);

  return { timeLeft, resetTimer };
};