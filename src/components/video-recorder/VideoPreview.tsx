import { forwardRef } from "react";
import type { RecordingState } from "./types";

interface VideoPreviewProps {
  isRecording: boolean;
  timeLeft: number;
  recordingState: RecordingState;
}

const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(
  ({ isRecording, timeLeft, recordingState }, ref) => {
    return (
      <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ minHeight: "400px" }}>
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain"
        />
        {(recordingState === "recording" || recordingState === "paused") && (
          <div className="absolute top-4 right-4 bg-black/75 text-white px-3 py-1 rounded-full">
            {timeLeft}s
          </div>
        )}
        {recordingState === "idle" && (
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
      </div>
    );
  }
);

VideoPreview.displayName = "VideoPreview";

export default VideoPreview;