import { forwardRef } from "react";

interface VideoPreviewProps {
  isRecording: boolean;
  timeLeft: number;
}

const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(
  ({ isRecording, timeLeft }, ref) => {
    return (
      <div className="relative">
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className="w-full rounded-lg border border-gray-200 bg-black"
        />
        {isRecording && (
          <div className="absolute top-4 right-4 bg-black/75 text-white px-3 py-1 rounded-full">
            {timeLeft}s
          </div>
        )}
      </div>
    );
  }
);

VideoPreview.displayName = "VideoPreview";

export default VideoPreview;