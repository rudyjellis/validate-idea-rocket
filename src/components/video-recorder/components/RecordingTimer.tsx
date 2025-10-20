import { useEffect, useState, useRef } from 'react';

interface RecordingTimerProps {
  isRecording: boolean;
  isPaused: boolean;
}

const RecordingTimer = ({ isRecording, isPaused }: RecordingTimerProps) => {
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

  if (!isRecording) {
    return null;
  }

  return (
    <div 
      className="absolute top-4 right-4 z-20 pointer-events-none"
      style={{
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div className="px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm">
        <span className="text-white font-mono text-sm font-medium">
          {formatTime(elapsedSeconds)}
        </span>
      </div>
    </div>
  );
};

export default RecordingTimer;