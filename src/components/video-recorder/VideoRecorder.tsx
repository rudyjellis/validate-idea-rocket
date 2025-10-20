import { memo } from "react";
import type { VideoRecorderProps } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileVideoRecorder from "./components/MobileVideoRecorder";
import DesktopVideoRecorder from "./components/DesktopVideoRecorder";
import VideoRecorderErrorBoundary from "./ErrorBoundary";

/**
 * VideoRecorder component that handles both mobile and desktop video recording experiences
 * @param maxDuration Maximum duration of the recording in seconds (default: 30)
 */
const VideoRecorder = ({ 
  maxDuration = 30
}: VideoRecorderProps) => {
  // Custom hooks
  const isMobile = useIsMobile();
  
  // Memoized recorder component selection
  const RecorderComponent = isMobile ? MobileVideoRecorder : DesktopVideoRecorder;
  
  console.log(`[VideoRecorder] Rendering ${isMobile ? 'mobile' : 'desktop'} recorder`);

  return (
    <VideoRecorderErrorBoundary>
      <div 
        className={`
          flex 
          flex-col 
          ${isMobile ? 'h-[100dvh]' : ''} 
          transform-gpu
        `}
      >
        <div 
          className={`
            w-full 
            ${isMobile ? 'flex-1 relative' : 'max-w-4xl mx-auto'}
            transition-all 
            duration-300 
            ease-in-out
          `}
        >
          <RecorderComponent
            maxDuration={maxDuration}
          />
        </div>
      </div>
    </VideoRecorderErrorBoundary>
  );
};

// Add display name for debugging
VideoRecorder.displayName = "VideoRecorder";

// Memoize the component to prevent unnecessary re-renders
export default memo(VideoRecorder);