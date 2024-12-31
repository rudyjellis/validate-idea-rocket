import { forwardRef, useEffect, useState } from "react";
import type { RecordingState } from "./types";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { formatTime } from "./utils/timeUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Pause, StopCircle } from "lucide-react";

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
  ({ isRecording, timeLeft, recordingState, isPlayingBack, onTapToRecord, onTapToPause, onTapToStop, onTapToResume }, ref) => {
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
        <AspectRatio ratio={isMobile ? 9/16 : 16/9} className="h-full">
          <video
            ref={ref}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            webkit-playsinline="true"
          />
          {(recordingState === "recording" || recordingState === "paused") && (
            <div className="absolute top-6 right-6 bg-black/75 text-white px-4 py-2 rounded-full text-base font-medium shadow-lg">
              {timeLeft}s
            </div>
          )}
          {isMobile && recordingState === "idle" && !isPlayingBack && (
            <div className="absolute top-6 left-6 bg-black/75 text-white px-4 py-2 rounded-full text-base font-medium shadow-lg z-10">
              Tap to Record
            </div>
          )}
          {isMobile && recordingState === "idle" && !isPlayingBack && (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 active:bg-black/40 transition-colors cursor-pointer"
              onClick={handleTap}
            >
              <div className="w-24 h-24 rounded-full border-4 border-white/80 flex items-center justify-center mb-4 shadow-lg">
                <div className="w-20 h-20 rounded-full bg-white/80" />
              </div>
            </div>
          )}
          {recordingState === "recording" && (
            <>
              <button
                onClick={onTapToPause}
                className="absolute bottom-8 left-8 bg-black/75 p-4 rounded-full text-white hover:bg-black/90 transition-colors z-20 shadow-lg active:scale-95 transform"
              >
                <Pause className="w-8 h-8" />
              </button>
              <button
                onClick={onTapToStop}
                className="absolute bottom-8 right-8 bg-black/75 p-4 rounded-full text-white hover:bg-black/90 transition-colors z-20 shadow-lg active:scale-95 transform"
              >
                <StopCircle className="w-8 h-8" />
              </button>
            </>
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
            <>
              <div className="absolute top-6 left-6 bg-black/75 text-white px-4 py-2 rounded-full text-base font-medium shadow-lg">
                Playing Recording
              </div>
              <div className="absolute bottom-6 left-6 bg-black/75 text-white px-4 py-2 rounded-full text-base font-medium shadow-lg">
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