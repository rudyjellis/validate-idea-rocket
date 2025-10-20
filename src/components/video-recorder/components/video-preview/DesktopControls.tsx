import { RecordingState } from "../../types";
import PlaybackOverlay from "../PlaybackOverlay";
import RecordingControls from "../../RecordingControls";
import { StopCircle } from "lucide-react";

interface DesktopControlsProps {
  recordingState: RecordingState;
  currentTime: number;
  isPlayingBack?: boolean;
  hasRecording?: boolean;
  onStopPlayback?: () => void;
  onTapToStop?: () => void;
  onTapToPause?: () => void;
  onTapToResume?: () => void;
  onPlayback?: () => void;
  onStartRecording?: () => void;
  onDownload?: (format: 'webm' | 'mp4') => void;
}

const DesktopControls = ({
  recordingState,
  currentTime,
  isPlayingBack,
  hasRecording = false,
  onStopPlayback,
  onTapToStop,
  onTapToPause,
  onTapToResume,
  onPlayback,
  onStartRecording,
  onDownload,
}: DesktopControlsProps) => {
  return (
    <>
      {isPlayingBack && (
        <>
          <PlaybackOverlay currentTime={currentTime} />
          <button
            onClick={onStopPlayback}
            className="absolute bottom-8 right-8 bg-black/75 p-4 rounded-full text-white hover:bg-black/90 transition-colors z-20 shadow-lg active:scale-95 transform"
          >
            <StopCircle className="w-8 h-8" />
          </button>
        </>
      )}
      <RecordingControls
        recordingState={recordingState}
        onStartRecording={onStartRecording || (() => {})}
        onStopRecording={onTapToStop || (() => {})}
        onPauseRecording={onTapToPause}
        onResumeRecording={onTapToResume}
        onDownload={onDownload || (() => {})}
        onPlayback={onPlayback || (() => {})}
        hasRecording={hasRecording}
        isPlayingBack={isPlayingBack}
      />
    </>
  );
};

export default DesktopControls;