export type MediaDeviceInfo = {
  deviceId: string;
  groupId: string;
  kind: string;
  label: string;
};

export type RecordingState = "idle" | "recording" | "paused";

export type VideoFormat = "webm" | "mp4";

export interface VideoRecorderProps {
  maxDuration?: number;
  onRecordingComplete?: (blob: Blob) => void;
}

export interface CameraSelectorProps {
  cameras: MediaDeviceInfo[];
  selectedCamera: string;
  onCameraChange: (deviceId: string) => void;
  disabled: boolean;
}

export interface VideoPreviewProps {
  isRecording: boolean;
  timeLeft: number;
  recordingState: RecordingState;
  isPlayingBack?: boolean;
}

export interface RecordingControlsProps {
  recordingState: RecordingState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onDownload: (format: VideoFormat) => void;
  onPlayback: () => void;
  hasRecording: boolean;
}