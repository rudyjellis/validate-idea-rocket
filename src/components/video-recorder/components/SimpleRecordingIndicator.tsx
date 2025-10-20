import React from 'react';
import type { RecordingState } from '../types';

interface SimpleRecordingIndicatorProps {
  recordingState: RecordingState;
  timeLeft: number;
  isMobile?: boolean;
}

const SimpleRecordingIndicator = ({
  recordingState,
  timeLeft,
  isMobile = false,
}: SimpleRecordingIndicatorProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
        return {
          bgColor: 'bg-gray-500',
          textColor: 'text-white',
          icon: '⏹️',
          text: 'Ready',
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`absolute top-14 right-4 z-20 flex flex-col items-end gap-2 ${isMobile ? 'pr-4' : 'pr-2'}`}>
      {/* Recording Status */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor} ${
          config.pulse ? 'animate-pulse' : ''
        }`}
      >
        <span className="text-lg">{config.icon}</span>
        <span className="font-medium">{config.text}</span>
      </div>
    </div>
  );
};

export default SimpleRecordingIndicator;
