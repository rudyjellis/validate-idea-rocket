import { forwardRef, useEffect, useState } from "react";
import type { RecordingState } from "./types";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { formatTime } from "./utils/timeUtils";

interface VideoPreviewProps {
  isRecording: boolean;
  timeLeft: number;
  recordingState: RecordingState;
  isPlayingBack?: boolean;
}

const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(
  ({ isRecording, timeLeft, recordingState, isPlayingBack }, ref) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
      const videoElement = ref as React.MutableRefObject<HTMLVideoElement>;
      if (!videoElement.current) return;

      const handleTimeUpdate = () => {
        setCurrentTime(videoElement.current.currentTime);
      };

      const handleLoadedMetadata = () => {
        setDuration(videoElement.current.duration);
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
      <div className="relative w-full bg-black rounded-lg overflow-hidden">
        <AspectRatio ratio={19 / 9}>
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
                {formatTime(currentTime)} / {formatTime(duration)}
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