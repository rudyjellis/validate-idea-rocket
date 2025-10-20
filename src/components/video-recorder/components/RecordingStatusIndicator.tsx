import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, Timer } from 'lucide-react';
import type { RecordingState } from '../types';

interface RecordingStatusIndicatorProps {
  recordingState: RecordingState;
  timeLeft: number;
  isMobile?: boolean;
  onToggleMute?: () => void;
  onToggleVideo?: () => void;
  isMuted?: boolean;
  isVideoDisabled?: boolean;
}

const RecordingStatusIndicator = ({
  recordingState,
  timeLeft,
  isMobile = false,
  onToggleMute,
  onToggleVideo,
  isMuted = false,
  isVideoDisabled = false,
}: RecordingStatusIndicatorProps) => {
  const statusConfig = useMemo(() => {
    switch (recordingState) {
      case 'recording':
        return {
          variant: 'destructive' as const,
          icon: '🔴',
          text: 'Recording',
          bgColor: 'bg-red-500',
          pulse: true,
        };
      case 'paused':
        return {
          variant: 'secondary' as const,
          icon: '⏸️',
          text: 'Paused',
          bgColor: 'bg-yellow-500',
          pulse: false,
        };
      case 'idle':
      default:
        return {
          variant: 'outline' as const,
          icon: '⏹️',
          text: 'Ready',
          bgColor: 'bg-gray-500',
          pulse: false,
        };
    }
  }, [recordingState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`absolute top-4 left-4 right-4 z-20 flex items-center justify-between ${isMobile ? 'px-4' : 'px-2'}`}>
      {/* Recording Status */}
      <div className="flex items-center gap-2">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${
            statusConfig.variant === 'destructive' 
              ? 'bg-red-500 text-white border-red-500' 
              : statusConfig.variant === 'secondary'
              ? 'bg-gray-200 text-gray-800 border-gray-300'
              : 'bg-white text-gray-800 border-gray-300'
          } ${statusConfig.pulse ? 'animate-pulse' : ''}`}
        >
          <span className="text-lg">{statusConfig.icon}</span>
          <span className="font-medium">{statusConfig.text}</span>
        </div>

        {/* Timer */}
        {recordingState !== 'idle' && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-800 border border-gray-300">
            <Timer className="h-3 w-3" />
            <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {/* Mute Toggle */}
        {onToggleMute && (
          <Button
            size={isMobile ? "sm" : "icon"}
            variant={isMuted ? "destructive" : "secondary"}
            onClick={onToggleMute}
            className="h-8 w-8"
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}

        {/* Video Toggle */}
        {onToggleVideo && (
          <Button
            size={isMobile ? "sm" : "icon"}
            variant={isVideoDisabled ? "destructive" : "secondary"}
            onClick={onToggleVideo}
            className="h-8 w-8"
          >
            {isVideoDisabled ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
};

export default RecordingStatusIndicator;
