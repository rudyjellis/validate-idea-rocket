import React, { useEffect, useState } from "react";

interface MobileLoadingOverlayProps {
  isInitializing: boolean;
  message?: string;
}

const MobileLoadingOverlay = ({ isInitializing, message = "Initializing camera..." }: MobileLoadingOverlayProps) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isInitializing) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isInitializing]);

  if (!isInitializing) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-6 px-8">
        {/* Mobile-optimized spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-white/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        
        {/* Mobile-optimized message */}
        <div className="text-white text-center">
          <div className="text-xl font-semibold mb-2">{message}</div>
          <div className="text-base opacity-80 mb-3">
            Please allow camera access when prompted
          </div>
          <div className="text-sm opacity-60">
            {message}{dots}
          </div>
        </div>

        {/* Mobile-specific instructions */}
        <div className="text-white/70 text-center text-sm max-w-xs">
          <div className="mb-2">📱 Mobile Tips:</div>
          <div className="text-xs space-y-1">
            <div>• Tap "Allow" when prompted</div>
            <div>• Use front camera for selfie videos</div>
            <div>• Hold device steady while recording</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLoadingOverlay;
