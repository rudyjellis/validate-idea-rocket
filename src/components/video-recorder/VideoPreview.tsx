import { forwardRef, useEffect, useState, memo, useCallback, useMemo } from "react";
import type { RecordingState } from "./types";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useIsMobile } from "@/hooks/use-mobile";
import RecordingTimer from "./components/RecordingTimer";
import VideoElement, { VideoElementRef } from "./components/VideoElement";
import MobileControls from "./components/video-preview/MobileControls";
import DesktopControls from "./components/video-preview/DesktopControls";
import SimpleRecordingIndicator from "./components/SimpleRecordingIndicator";
import CountdownOverlay from "./components/CountdownOverlay";
import AudioAnalyzerTest from "./components/AudioAnalyzerTest";
import { createVideoRecorderLogger } from "@/utils/logger";

const log = createVideoRecorderLogger('VideoPreview');

interface VideoPreviewProps {
  isRecording: boolean;
  timeLeft: number;
  recordingState: RecordingState;
  isPlayingBack?: boolean;
  currentStream?: MediaStream | null;
  hasRecording?: boolean;
  recordedBlob?: Blob | null;
  showCountdown?: boolean;
  onCountdownComplete?: () => void;
  onTapToRecord?: () => void;
  onTapToPause?: () => void;
  onTapToStop?: () => void;
  onTapToResume?: () => void;
  onPlayback?: () => void;
  onStopPlayback?: () => void;
  onDownload?: (format: 'webm' | 'mp4') => void;
  onStartRecording?: () => void;
}

const VideoPreview = forwardRef<VideoElementRef, VideoPreviewProps>(
  ({
    isRecording,
    timeLeft,
    recordingState,
    isPlayingBack = false,
    currentStream,
    hasRecording = false,
    recordedBlob,
    showCountdown = false,
    onCountdownComplete,
    onTapToRecord,
    onTapToPause,
    onTapToStop,
    onTapToResume,
    onPlayback,
    onStopPlayback,
    onDownload,
    onStartRecording
  }, ref) => {
    // State management with descriptive names
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    
    // Custom hooks
    const isMobile = useIsMobile();

    // Time tracking effect - VideoElementRef doesn't expose addEventListener
    // This is handled internally by the VideoElement component
    useEffect(() => {
      // We can track time through getCurrentTime if needed for display
      if (!ref || typeof ref === 'function') return;
      
      const interval = setInterval(() => {
        if (ref.current && isPlayingBack) {
          const time = ref.current.getCurrentTime();
          setCurrentTime(time);
        }
      }, 100);

      return () => clearInterval(interval);
    }, [ref, isPlayingBack]);

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
              currentMode={isPlayingBack ? 'playback' : 'stream'}
              stream={currentStream}
              recordedBlob={recordedBlob}
            />
            
            {/* Countdown Overlay */}
            {showCountdown && onCountdownComplete && (
              <CountdownOverlay onComplete={onCountdownComplete} />
            )}
            
            {/* Audio Analyzer Test - TEMPORARY */}
            <AudioAnalyzerTest
              stream={currentStream}
              isActive={recordingState === 'recording'}
            />
            
            {/* Simple Recording Indicator */}
            <SimpleRecordingIndicator
              recordingState={recordingState}
              timeLeft={timeLeft}
              isMobile={isMobile}
            />

            {isMobile ? (
              <MobileControls
                recordingState={recordingState}
                isRecording={isRecording}
                isPlayingBack={isPlayingBack}
                isFullscreen={isFullscreen}
                hasRecording={hasRecording}
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
                hasRecording={hasRecording}
                onStopPlayback={onStopPlayback}
                onTapToStop={onTapToStop}
                onTapToPause={onTapToPause}
                onTapToResume={onTapToResume}
                onPlayback={onPlayback}
                onStartRecording={onStartRecording}
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