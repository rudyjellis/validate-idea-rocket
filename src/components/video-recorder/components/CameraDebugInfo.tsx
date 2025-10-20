import React, { useState } from 'react';
import type { MediaDeviceInfo } from '../types';
import type { VideoElementRef } from './VideoElement';
import { Button } from '@/components/ui/button';

interface CameraDebugInfoProps {
  cameras: MediaDeviceInfo[];
  selectedCamera: string;
  isInitializing: boolean;
  videoRef: React.RefObject<VideoElementRef>;
}

const CameraDebugInfo = ({ cameras, selectedCamera, isInitializing, videoRef }: CameraDebugInfoProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-4 z-50 bg-black/80 text-white border-white/20 hover:bg-black/90 hover:text-white"
      >
        🔍 {isOpen ? 'Hide' : 'Show'} Debug
      </Button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-16 left-4 bg-black/90 text-white text-xs p-3 rounded max-w-sm z-50 border border-white/20">
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
      )}
    </>
  );
};

export default CameraDebugInfo;
