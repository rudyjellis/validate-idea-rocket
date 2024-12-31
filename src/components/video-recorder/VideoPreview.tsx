import { forwardRef } from "react";
import type { RecordingState } from "./types";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface VideoPreviewProps {
  isRecording: boolean;
  timeLeft: number;
  recordingState: RecordingState;
  isPlayingBack?: boolean;
}

const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(
  ({ isRecording, timeLeft, recordingState, isPlayingBack }, ref) => {
    return (
      <div className="relative w-full bg-black rounded-lg overflow-hidden">
        <AspectRatio ratio={19 / 6}>
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
            <div className="absolute top-4 left-4 bg-black/75 text-white px-3 py-1 rounded-full">
              Playing Recording
            </div>
          )}
        </AspectRatio>
      </div>
    );
  }
);

VideoPreview.displayName = "VideoPreview";

export default VideoPreview;