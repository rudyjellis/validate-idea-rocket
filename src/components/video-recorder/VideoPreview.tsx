import { forwardRef, useEffect, useState, memo } from "react";
import type { RecordingState } from "./types";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useIsMobile } from "@/hooks/use-mobile";
import RecordingTimer from "./components/RecordingTimer";
import RecordingControls from "./RecordingControls";
import PlaybackOverlay from "./components/PlaybackOverlay";
import RecordButton from "./components/RecordButton";
import FullscreenButton from "./components/FullscreenButton";
import VideoElement from "./components/VideoElement";
import TapToRecordIndicator from "./components/TapToRecordIndicator";
import { StopCircle } from "lucide-react";

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
    isPlayingBack,
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
      const videoElement = ref as React.MutableRefObject<HTMLVideoElement>;
      if (!videoElement?.current) {
        console.log("No video element found");
        return;
      }

      console.log("Setting up video element");

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

    const toggleFullscreen = async () => {
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
    };

    const renderMobileUI = () => (
      <>
        {recordingState === "idle" && !isPlayingBack && (
          <>
            <TapToRecordIndicator />
            <RecordButton onClick={onTapToRecord!} />
          </>
        )}

        {recordingState === "recording" && (
          <RecordingControls
            recordingState={recordingState}
            onTapToPause={onTapToPause}
            onTapToStop={onTapToStop}
            hasRecording={false}
            onStartRecording={() => {}}
            onStopRecording={() => {}}
            onPauseRecording={() => {}}
            onResumeRecording={() => {}}
            onDownload={onDownload}
            onPlayback={() => {}}
          />
        )}

        {recordingState === "paused" && (
          <>
            <div className="absolute top-6 left-6 bg-black/75 text-white px-4 py-2 rounded-full text-base font-medium shadow-lg z-10">
              Tap to Resume
            </div>
            <div
              className="absolute inset-0 bg-black/50 cursor-pointer"
              onClick={onTapToResume}
            />
          </>
        )}

        {recordingState === "idle" && !isRecording && (
          <FullscreenButton
            isFullscreen={isFullscreen}
            onClick={toggleFullscreen}
          />
        )}
      </>
    );

    const renderCommonControls = () => (
      <>
        {isPlayingBack && (
          <>
            <PlaybackOverlay currentTime={currentTime} />
            <button
              onClick={onStopPlayback}
              className="absolute bottom-8 right-8 bg-black/75 p-4 rounded-full text-white hover:bg-black/90 transition-colors z-20 shadow-lg active:scale-95 transform"
            >
              <StopCircle className="w-8 h-8" />
            </button>
          </>
        )}
        {!isMobile && (
          <RecordingControls
            recordingState={recordingState}
            onStartRecording={() => {}}
            onStopRecording={onTapToStop!}
            onPauseRecording={onTapToPause}
            onResumeRecording={onTapToResume}
            onDownload={onDownload!}
            onPlayback={onPlayback!}
            hasRecording={true}
            isPlayingBack={isPlayingBack}
          />
        )}
      </>
    );

    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${isMobile ? 'w-full h-full absolute inset-0' : 'w-full'}`}>
        <div className="video-container w-full h-full transform-gpu">
          <AspectRatio ratio={isMobile ? 9 / 16 : 16 / 9} className="h-full">
            <VideoElement ref={ref} isPlayingBack={isPlayingBack} />
            {(recordingState === "recording" || recordingState === "paused") && (
              <RecordingTimer timeLeft={timeLeft} />
            )}
            {isMobile ? renderMobileUI() : renderCommonControls()}
          </AspectRatio>
        </div>
      </div>
    );
  }
);

VideoPreview.displayName = "VideoPreview";

export default memo(VideoPreview);
