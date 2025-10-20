import { useEffect, useState, useRef } from 'react';
import type { RecordingState } from '../types';

interface RecordingTimerProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingState: RecordingState;
}

const RecordingTimer = ({ isRecording, isPaused, recordingState }: RecordingTimerProps) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording && !isPaused) {
      // Start or resume timer
      startTimeRef.current = Date.now();
      
      const updateTimer = () => {
        if (startTimeRef.current) {
          const currentElapsed = (Date.now() - startTimeRef.current) / 1000;
          const totalElapsed = pausedTimeRef.current + currentElapsed;
          setElapsedSeconds(totalElapsed);
          animationFrameRef.current = requestAnimationFrame(updateTimer);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    } else if (isPaused && startTimeRef.current) {
      // Pause: save elapsed time
      const currentElapsed = (Date.now() - startTimeRef.current) / 1000;
      pausedTimeRef.current += currentElapsed;
      startTimeRef.current = null;
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    } else if (!isRecording) {
      // Reset when not recording
      setElapsedSeconds(0);
      pausedTimeRef.current = 0;
      startTimeRef.current = null;
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status configuration
  const getStatusConfig = () => {
    switch (recordingState) {
      case 'recording':
        return {
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          icon: '🔴',
          text: 'Recording',
          pulse: true,
        };
      case 'paused':
        return {
          bgColor: 'bg-yellow-500',
          textColor: 'text-black',
          icon: '⏸️',
          text: 'Paused',
          pulse: false,
        };
      case 'idle':
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config) {
    return null;
  }

  return (
    <div 
      className="absolute top-4 right-4 z-20 pointer-events-none"
      style={{
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div className="flex flex-col items-end gap-2">
        {/* Status Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor} ${
            config.pulse ? 'animate-pulse' : ''
          }`}
        >
          <span className="text-lg">{config.icon}</span>
          <span className="font-medium">{config.text}</span>
        </div>

        {/* Timer */}
        {isRecording && (
          <div className="px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm">
            <span className="text-white font-mono text-sm font-medium">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingTimer;