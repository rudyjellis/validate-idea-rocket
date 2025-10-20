import React, { useMemo } from 'react';
import type { RecordingState } from '../types';

interface RecordingPulseEffectProps {
  recordingState: RecordingState;
  isMobile?: boolean;
}

const RecordingPulseEffect = ({ recordingState, isMobile = false }: RecordingPulseEffectProps) => {
  const shouldShow = recordingState === 'recording';

  const pulseConfig = useMemo(() => ({
    size: isMobile ? 120 : 80,
    animationDuration: '2s',
    color: '#ef4444', // red-500
  }), [isMobile]);

  if (!shouldShow) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
      {/* Outer pulse ring */}
      <div
        className="absolute rounded-full border-2 opacity-20 animate-ping"
        style={{
          width: pulseConfig.size,
          height: pulseConfig.size,
          borderColor: pulseConfig.color,
          animationDuration: pulseConfig.animationDuration,
        }}
      />
      
      {/* Inner pulse ring */}
      <div
        className="absolute rounded-full border border-opacity-40 animate-pulse"
        style={{
          width: pulseConfig.size * 0.7,
          height: pulseConfig.size * 0.7,
          borderColor: pulseConfig.color,
        }}
      />
      
      {/* Center dot */}
      <div
        className="absolute rounded-full bg-red-500 animate-pulse"
        style={{
          width: 12,
          height: 12,
        }}
      />
    </div>
  );
};

export default RecordingPulseEffect;
