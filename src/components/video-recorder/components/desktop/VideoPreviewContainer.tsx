import VideoPreview from "../../VideoPreview";
import LoadingOverlay from "./LoadingOverlay";
import type { RecordingState } from "../../types";
import type { VideoElementRef } from "../VideoElement";

interface VideoPreviewContainerProps {
  videoRef: React.RefObject<VideoElementRef>;
  isInitializing: boolean;
  recordingState: RecordingState;
  timeLeft: number;
  isPlayingBack: boolean;
  recordedChunks: Blob[];
  currentStream: MediaStream | null;
  onPlayback: () => void;
  onStopPlayback: () => void;
  onDownload: (format: 'webm' | 'mp4') => void;
}

const VideoPreviewContainer = ({
  videoRef,
  isInitializing,
  recordingState,
  timeLeft,
  isPlayingBack,
  recordedChunks,
  currentStream,
  onPlayback,
  onStopPlayback,
  onDownload,
}: VideoPreviewContainerProps) => {
  return (
    <div className="mt-4 relative aspect-video bg-black rounded-lg overflow-hidden">
      <LoadingOverlay 
        isInitializing={isInitializing} 
        message="Setting up camera..."
      />
      <VideoPreview
        ref={videoRef}
        isRecording={recordingState === "recording"}
        timeLeft={timeLeft}
        recordingState={recordingState}
        isPlayingBack={isPlayingBack}
        currentStream={currentStream}
        onPlayback={recordedChunks.length > 0 ? onPlayback : undefined}
        onStopPlayback={onStopPlayback}
        onDownload={onDownload}
      />
    </div>
  );
};

export default VideoPreviewContainer;