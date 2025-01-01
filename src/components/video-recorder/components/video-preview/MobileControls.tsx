import { RecordingState } from "../../types";
import TapToRecordIndicator from "../TapToRecordIndicator";
import RecordButton from "../RecordButton";
import RecordingControls from "../../RecordingControls";
import FullscreenButton from "../FullscreenButton";

interface MobileControlsProps {
  recordingState: RecordingState;
  isRecording: boolean;
  isPlayingBack: boolean;
  isFullscreen: boolean;
  onTapToRecord?: () => void;
  onTapToPause?: () => void;
  onTapToStop?: () => void;
  onTapToResume?: () => void;
  onDownload?: (format: 'webm' | 'mp4') => void;
  toggleFullscreen: () => void;
}

const MobileControls = ({
  recordingState,
  isRecording,
  isPlayingBack,
  isFullscreen,
  onTapToRecord,
  onTapToPause,
  onTapToStop,
  onTapToResume,
  onDownload,
  toggleFullscreen,
}: MobileControlsProps) => {
  return (
    <>
      {recordingState === "idle" && !isPlayingBack && (
        <>
          <TapToRecordIndicator />
          <RecordButton onClick={onTapToRecord!} />
        </>
      )}

      {recordingState === "recording" && (
        <RecordingControls
          recordingState={recordingState}
          onTapToPause={onTapToPause}
          onTapToStop={onTapToStop}
          hasRecording={false}
          onStartRecording={() => {}}
          onStopRecording={() => {}}
          onPauseRecording={() => {}}
          onResumeRecording={() => {}}
          onDownload={onDownload}
          onPlayback={() => {}}
        />
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

      {recordingState === "idle" && !isRecording && (
        <FullscreenButton
          isFullscreen={isFullscreen}
          onClick={toggleFullscreen}
        />
      )}
    </>
  );
};

export default MobileControls;