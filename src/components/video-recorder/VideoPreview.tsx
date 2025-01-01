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
    const [currentTime, setCurrentTime] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
      console.log("Setting up video element time tracking");
      const videoElement = ref as React.MutableRefObject<HTMLVideoElement>;
      if (!videoElement?.current) {
        console.log("No video element found");
        return;
      }

      const handleTimeUpdate = () => {
        setCurrentTime(videoElement.current.currentTime);
      };

      videoElement.current.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        if (videoElement.current) {
          videoElement.current.removeEventListener('timeupdate', handleTimeUpdate);
        }
      };
    }, [ref]);

    const toggleFullscreen = useCallback(async () => {
      console.log("Toggling fullscreen mode");
      const videoContainer = document.querySelector('.video-container') as HTMLElement;

      if (!document.fullscreenElement) {
        try {
          await videoContainer.requestFullscreen();
          setIsFullscreen(true);
        } catch (err) {
          console.error("Error attempting to enable fullscreen:", err);
        }
      } else {
        try {
          await document.exitFullscreen();
          setIsFullscreen(false);
        } catch (err) {
          console.error("Error attempting to exit fullscreen:", err);
        }
      }
    }, []);

    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${isMobile ? 'w-full h-full absolute inset-0' : 'w-full'}`}>
        <div className="video-container w-full h-full transform-gpu">
          <AspectRatio ratio={isMobile ? 9 / 16 : 16 / 9} className="h-full">
            <VideoElement ref={ref} isPlayingBack={isPlayingBack} />
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

VideoPreview.displayName = "VideoPreview";

export default memo(VideoPreview);