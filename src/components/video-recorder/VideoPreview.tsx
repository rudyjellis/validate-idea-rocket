import { forwardRef, useEffect, useState } from "react";
import type { RecordingState } from "./types";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useIsMobile } from "@/hooks/use-mobile";
import { Maximize2, RefreshCw } from "lucide-react";
import RecordingTimer from "./components/RecordingTimer";
import RecordingControls from "./components/RecordingControls";
import PlaybackOverlay from "./components/PlaybackOverlay";
import RecordButton from "./components/RecordButton";

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
    onPlayback 
  }, ref) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
      const videoElement = ref as React.MutableRefObject<HTMLVideoElement>;
      if (!videoElement.current) {
        console.log("No video element found");
        return;
      }

      console.log("Setting up video element");
      
      const handleTimeUpdate = () => {
        setCurrentTime(videoElement.current.currentTime);
      };

      const handleLoadedMetadata = () => {
        console.log("Video metadata loaded");
        videoElement.current.play().catch(error => {
          console.error("Error playing video:", error);
        });
      };

      videoElement.current.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.current.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        if (videoElement.current) {
          videoElement.current.removeEventListener('timeupdate', handleTimeUpdate);
          videoElement.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
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

    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${isMobile ? 'w-full h-full absolute inset-0' : 'w-full'}`}>
        <div className="video-container w-full h-full">
          <AspectRatio ratio={isMobile ? 9/16 : 16/9} className="h-full">
            <video
              ref={ref}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              webkit-playsinline="true"
              x-webkit-airplay="allow"
              preload="metadata"
            />
            
            {(recordingState === "recording" || recordingState === "paused") && (
              <RecordingTimer timeLeft={timeLeft} />
            )}

            {isMobile && recordingState === "idle" && !isPlayingBack && (
              <div className="absolute top-6 left-6 bg-black/75 text-white px-4 py-2 rounded-full text-base font-medium shadow-lg z-10">
                Tap to Record
              </div>
            )}

            {isMobile && recordingState === "idle" && !isPlayingBack && (
              <RecordButton onClick={onTapToRecord!} />
            )}

            {recordingState === "recording" && (
              <RecordingControls 
                onTapToPause={onTapToPause} 
                onTapToStop={onTapToStop} 
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

            {isPlayingBack && (
              <PlaybackOverlay currentTime={currentTime} />
            )}

            {/* Only show fullscreen button when not recording and on mobile */}
            {isMobile && recordingState === "idle" && !isRecording && (
              <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 bg-black/75 p-2 rounded-full text-white hover:bg-black/90 transition-colors z-20"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                <Maximize2 className="w-6 h-6" />
              </button>
            )}

            {/* Add replay button for mobile */}
            {isMobile && recordingState === "idle" && !isPlayingBack && onPlayback && (
              <button
                onClick={onPlayback}
                className="absolute bottom-4 right-4 bg-black/75 p-2 rounded-full text-white hover:bg-black/90 transition-colors z-20"
                aria-label="Replay recording"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            )}
          </AspectRatio>
        </div>
      </div>
    );
  }
);

VideoPreview.displayName = "VideoPreview";

export default VideoPreview;