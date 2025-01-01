import { forwardRef, useEffect, useState, memo, useCallback } from "react";
import type { RecordingState } from "./types";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useIsMobile } from "@/hooks/use-mobile";
import RecordingTimer from "./components/RecordingTimer";
import VideoElement from "./components/VideoElement";
import MobileControls from "./components/video-preview/MobileControls";
import DesktopControls from "./components/video-preview/DesktopControls";

interface VideoPreviewProps {
  isRecording: boolean;
  timeLeft: number;
  recordingState: RecordingState;
  isPlayingBack?: boolean;
  onTapToRecord?: () => void;
  onTapToPause?: () => void;
  onTapToStop?: () => void;
  onTapToResume?: () => void;
  onPlayback?: () => void;
  onStopPlayback?: () => void;
  onDownload?: (format: 'webm' | 'mp4') => void;
}

const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(
  ({
    isRecording,
    timeLeft,
    recordingState,
    isPlayingBack = false,
    onTapToRecord,
    onTapToPause,
    onTapToStop,
    onTapToResume,
    onPlayback,
    onStopPlayback,
    onDownload
  }, ref) => {
    // State management with descriptive names
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    
    // Custom hooks
    const isMobile = useIsMobile();

    // Time tracking effect with cleanup
    useEffect(() => {
      console.log("[VideoPreview] Setting up video element time tracking");
      const videoElement = ref as React.MutableRefObject<HTMLVideoElement>;
      
      if (!videoElement?.current) {
        console.log("[VideoPreview] No video element found");
        return;
      }

      const handleTimeUpdate = () => {
        const newTime = videoElement.current.currentTime;
        console.log("[VideoPreview] Time updated:", newTime);
        setCurrentTime(newTime);
      };

      videoElement.current.addEventListener('timeupdate', handleTimeUpdate);

      // Cleanup function
      return () => {
        console.log("[VideoPreview] Cleaning up time tracking");
        if (videoElement.current) {
          videoElement.current.removeEventListener('timeupdate', handleTimeUpdate);
        }
      };
    }, [ref]);

    // Memoized fullscreen handler
    const toggleFullscreen = useCallback(async () => {
      console.log("[VideoPreview] Toggling fullscreen mode");
      const videoContainer = document.querySelector('.video-container') as HTMLElement;

      try {
        if (!document.fullscreenElement) {
          await videoContainer.requestFullscreen();
          setIsFullscreen(true);
          console.log("[VideoPreview] Entered fullscreen mode");
        } else {
          await document.exitFullscreen();
          setIsFullscreen(false);
          console.log("[VideoPreview] Exited fullscreen mode");
        }
      } catch (err) {
        console.error("[VideoPreview] Fullscreen error:", err);
      }
    }, []);

    // Memoized container classes for better performance
    const containerClasses = `relative bg-black rounded-lg overflow-hidden transform-gpu ${
      isMobile ? 'w-full h-full absolute inset-0' : 'w-full'
    }`;

    return (
      <div className={containerClasses}>
        <div className="video-container w-full h-full transform-gpu">
          <AspectRatio 
            ratio={isMobile ? 9 / 16 : 16 / 9} 
            className="h-full"
          >
            <VideoElement 
              ref={ref} 
              isPlayingBack={isPlayingBack} 
            />
            
            {(recordingState === "recording" || recordingState === "paused") && (
              <RecordingTimer timeLeft={timeLeft} />
            )}

            {isMobile ? (
              <MobileControls
                recordingState={recordingState}
                isRecording={isRecording}
                isPlayingBack={isPlayingBack}
                isFullscreen={isFullscreen}
                onTapToRecord={onTapToRecord}
                onTapToPause={onTapToPause}
                onTapToStop={onTapToStop}
                onTapToResume={onTapToResume}
                onDownload={onDownload}
                toggleFullscreen={toggleFullscreen}
              />
            ) : (
              <DesktopControls
                recordingState={recordingState}
                currentTime={currentTime}
                isPlayingBack={isPlayingBack}
                onStopPlayback={onStopPlayback}
                onTapToStop={onTapToStop}
                onTapToPause={onTapToPause}
                onTapToResume={onTapToResume}
                onPlayback={onPlayback}
                onDownload={onDownload}
              />
            )}
          </AspectRatio>
        </div>
      </div>
    );
  }
);

// Add display name for better debugging
VideoPreview.displayName = "VideoPreview";

// Memoize the component to prevent unnecessary re-renders
export default memo(VideoPreview);