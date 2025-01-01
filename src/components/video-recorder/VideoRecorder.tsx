import { memo } from "react";
import type { VideoRecorderProps } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileVideoRecorder from "./components/MobileVideoRecorder";
import DesktopVideoRecorder from "./components/DesktopVideoRecorder";

/**
 * VideoRecorder component that handles both mobile and desktop video recording experiences
 * @param maxDuration Maximum duration of the recording in seconds (default: 30)
 * @param onRecordingComplete Callback function called when recording is completed
 */
const VideoRecorder = ({ 
  maxDuration = 30, 
  onRecordingComplete 
}: VideoRecorderProps) => {
  // Custom hooks
  const isMobile = useIsMobile();
  
  // Memoized recorder component selection
  const RecorderComponent = isMobile ? MobileVideoRecorder : DesktopVideoRecorder;
  
  console.log(`[VideoRecorder] Rendering ${isMobile ? 'mobile' : 'desktop'} recorder`);

  return (
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
          onRecordingComplete={onRecordingComplete}
        />
      </div>
    </div>
  );
};

// Add display name for debugging
VideoRecorder.displayName = "VideoRecorder";

// Memoize the component to prevent unnecessary re-renders
export default memo(VideoRecorder);