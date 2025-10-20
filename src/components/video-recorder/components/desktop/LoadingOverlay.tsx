import { useEffect, useState } from "react";

interface LoadingOverlayProps {
  isInitializing: boolean;
  message?: string;
}

const LoadingOverlay = ({ isInitializing, message = "Initializing camera..." }: LoadingOverlayProps) => {
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
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="relative">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-white/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        
        {/* Message */}
        <div className="text-white text-center">
          <div className="text-lg font-medium">{message}</div>
          <div className="text-sm opacity-75">
            Please allow camera access when prompted
          </div>
          <div className="text-xs opacity-50 mt-1">
            {message}{dots}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;