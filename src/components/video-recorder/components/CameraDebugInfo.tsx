import React from 'react';
import type { MediaDeviceInfo } from '../types';
import type { VideoElementRef } from './VideoElement';

interface CameraDebugInfoProps {
  cameras: MediaDeviceInfo[];
  selectedCamera: string;
  isInitializing: boolean;
  videoRef: React.RefObject<VideoElementRef>;
}

const CameraDebugInfo = ({ cameras, selectedCamera, isInitializing, videoRef }: CameraDebugInfoProps) => {
  // Only show in development
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-3 rounded max-w-sm z-50">
      <div className="font-bold mb-2">🔍 Camera Debug Info</div>
      <div className="space-y-1">
        <div>Cameras found: {cameras.length}</div>
        <div>Selected: {selectedCamera || 'None'}</div>
        <div>Initializing: {isInitializing ? 'Yes' : 'No'}</div>
        <div>Has video element: {videoRef.current ? 'Yes' : 'No'}</div>
        {cameras.length > 0 && (
          <div className="mt-2">
            <div className="font-semibold">Available cameras:</div>
            {cameras.map((camera, index) => (
              <div key={camera.deviceId} className="ml-2 text-xs">
                {index + 1}. {camera.label || 'Unnamed Camera'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraDebugInfo;
