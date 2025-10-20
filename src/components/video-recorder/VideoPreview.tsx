import { forwardRef, useEffect, useState, memo, useCallback, useMemo } from "react";
import type { RecordingState } from "./types";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useIsMobile } from "@/hooks/use-mobile";
import RecordingTimer from "./components/RecordingTimer";
import VideoElement from "./components/VideoElement";
import MobileControls from "./components/video-preview/MobileControls";
import DesktopControls from "./components/video-preview/DesktopControls";
import SimpleRecordingIndicator from "./components/SimpleRecordingIndicator";
import { createVideoRecorderLogger } from "@/utils/logger";

const log = createVideoRecorderLogger('VideoPreview');

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
      log.log("Setting up video element time tracking");
      const videoElement = ref as React.RefObject<HTMLVideoElement>;
      
      if (!videoElement?.current) {
        log.log("No video element found");
        return;
      }

      const handleTimeUpdate = () => {
        if (!videoElement.current) {
          log.log("Video element null in handleTimeUpdate");
          return;
        }
        const newTime = videoElement.current.currentTime;
        setCurrentTime(newTime);
      };

      videoElement.current.addEventListener('timeupdate', handleTimeUpdate);

      // Cleanup function
      return () => {
        log.log("Cleaning up time tracking");
        if (videoElement.current) {
          videoElement.current.removeEventListener('timeupdate', handleTimeUpdate);
        }
      };
    }, [ref]);

    // Memoized fullscreen handler
    const toggleFullscreen = useCallback(async () => {
      log.log("Toggling fullscreen mode");
      const videoContainer = document.querySelector('.video-container') as HTMLElement;

      try {
        if (!document.fullscreenElement) {
          await videoContainer.requestFullscreen();
          setIsFullscreen(true);
          log.log("Entered fullscreen mode");
        } else {
          await document.exitFullscreen();
          setIsFullscreen(false);
          log.log("Exited fullscreen mode");
        }
      } catch (err) {
        log.error("Fullscreen error:", err);
      }
    }, []);

    // Memoized container classes for better performance
    const containerClasses = useMemo(() => 
      `relative bg-black rounded-lg overflow-hidden transform-gpu ${
        isMobile ? 'w-full h-full absolute inset-0' : 'w-full'
      }`,
      [isMobile]
    );

    // Memoized aspect ratio
    const aspectRatio = useMemo(() => isMobile ? 9 / 16 : 16 / 9, [isMobile]);

    return (
      <div className={containerClasses}>
        <div className="video-container w-full h-full transform-gpu">
          <AspectRatio 
            ratio={aspectRatio} 
            className="h-full"
          >
            <VideoElement 
              ref={ref} 
              isPlayingBack={isPlayingBack} 
            />
            
            {/* Simple Recording Indicator */}
            <SimpleRecordingIndicator
              recordingState={recordingState}
              timeLeft={timeLeft}
              isMobile={isMobile}
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