import { useIsMobile } from "@/hooks/use-mobile";
import DesktopRecordingControls from "./components/DesktopRecordingControls";
import MobileRecordingControls from "./components/MobileRecordingControls";
import type { RecordingState } from "./types";

interface RecordingControlsProps {
  recordingState: RecordingState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onDownload: (format: 'webm' | 'mp4') => void;
  onPlayback: () => void;
  onStopPlayback?: () => void;
  onRestart?: () => void;
  hasRecording: boolean;
  isPlayingBack?: boolean;
  onTapToPause?: () => void;
  onTapToStop?: () => void;
}

const RecordingControls = (props: RecordingControlsProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileRecordingControls
        recordingState={props.recordingState}
        onTapToPause={props.onTapToPause}
        onTapToStop={props.onTapToStop}
        onRestart={props.onRestart}
        onDownload={props.onDownload}
        hasRecording={props.hasRecording}
      />
    );
  }

  return <DesktopRecordingControls {...props} />;
};

export default RecordingControls;