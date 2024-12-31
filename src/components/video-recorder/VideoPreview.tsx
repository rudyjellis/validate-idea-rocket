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
  onTapToRecord?: () => void;
  onTapToPause?: () => void;
  onTapToStop?: () => void;
}

const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(
  ({ isRecording, timeLeft, recordingState, isPlayingBack, onTapToRecord, onTapToPause, onTapToStop }, ref) => {
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

    const handleTap = () => {
      console.log('Tap detected on video preview');
      if (isMobile && onTapToRecord) {
        onTapToRecord();
      }
    };

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
          {isMobile && recordingState === "idle" && !isPlayingBack && (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/30 active:bg-black/40 transition-colors cursor-pointer"
              onClick={handleTap}
            >
              <div className="w-20 h-20 rounded-full border-4 border-white/80 flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-white/80" />
              </div>
              <p className="text-lg font-medium mb-2">Tap to Record</p>
              <p className="text-sm text-gray-200">or use controls below</p>
            </div>
          )}
          {isMobile && recordingState === "recording" && (
            <div 
              className="absolute inset-0 flex items-center justify-center"
              onClick={onTapToPause}
            >
              <div className="absolute inset-0 bg-black/30" />
              <p className="text-white text-lg font-medium z-10">Tap to Pause</p>
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