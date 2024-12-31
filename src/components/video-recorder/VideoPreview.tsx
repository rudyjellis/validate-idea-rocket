import { forwardRef, useEffect, useState } from "react";
import type { RecordingState } from "./types";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useIsMobile } from "@/hooks/use-mobile";
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
    onTapToResume 
  }, ref) => {
    const [currentTime, setCurrentTime] = useState(0);
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

    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${isMobile ? 'w-full h-full absolute inset-0' : 'w-full'}`}>
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
        </AspectRatio>
      </div>
    );
  }
);

VideoPreview.displayName = "VideoPreview";

export default VideoPreview;