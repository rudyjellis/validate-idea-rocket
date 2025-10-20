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
  onStartRecording?: () => void;
  onTapToStop?: () => void;
  onTapToPause?: () => void;
  onTapToResume?: () => void;
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
  onStartRecording,
  onTapToStop,
  onTapToPause,
  onTapToResume,
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
        hasRecording={recordedChunks.length > 0}
        recordedBlob={recordedChunks.length > 0 ? new Blob(recordedChunks, { type: recordedChunks[0]?.type || 'video/webm' }) : null}
        onPlayback={recordedChunks.length > 0 ? onPlayback : undefined}
        onStopPlayback={onStopPlayback}
        onDownload={onDownload}
        onStartRecording={onStartRecording}
        onTapToStop={onTapToStop}
        onTapToPause={onTapToPause}
        onTapToResume={onTapToResume}
      />
    </div>
  );
};

export default VideoPreviewContainer;