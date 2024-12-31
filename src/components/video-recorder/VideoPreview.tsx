import { forwardRef, useEffect, useState } from "react";
import type { RecordingState } from "./types";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { formatTime } from "./utils/timeUtils";
import { useIsMobile } from "@/hooks/use-mobile";

interface VideoPreviewProps {
  isRecording: boolean;
  timeLeft: number;
  recordingState: RecordingState;
  isPlayingBack?: boolean;
}

const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(
  ({ isRecording, timeLeft, recordingState, isPlayingBack }, ref) => {
    const [currentTime, setCurrentTime] = useState(0);
    const isMobile = useIsMobile();

    useEffect(() => {
      const videoElement = ref as React.MutableRefObject<HTMLVideoElement>;
      if (!videoElement.current) return;

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

    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${isMobile ? 'w-full h-full' : 'w-full'}`}>
        <AspectRatio ratio={isMobile ? 9/16 : 16/9} className={isMobile ? 'h-full' : ''}>
          <video
            ref={ref}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {(recordingState === "recording" || recordingState === "paused") && (
            <div className="absolute top-4 right-4 bg-black/75 text-white px-3 py-1 rounded-full">
              {timeLeft}s
            </div>
          )}
          {recordingState === "idle" && !isPlayingBack && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50">
              <p className="text-lg font-medium mb-2">Ready to Record</p>
              <p className="text-sm text-gray-200">Click 'Start Recording' to begin</p>
            </div>
          )}
          {recordingState === "paused" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50">
              <p className="text-lg font-medium mb-2">Recording Paused</p>
              <p className="text-sm text-gray-200">Click 'Resume' to continue</p>
            </div>
          )}
          {isPlayingBack && (
            <>
              <div className="absolute top-4 left-4 bg-black/75 text-white px-3 py-1 rounded-full">
                Playing Recording
              </div>
              <div className="absolute bottom-4 left-4 bg-black/75 text-white px-3 py-1 rounded-full">
                {formatTime(currentTime)}
              </div>
            </>
          )}
        </AspectRatio>
      </div>
    );
  }
);

VideoPreview.displayName = "VideoPreview";

export default VideoPreview;