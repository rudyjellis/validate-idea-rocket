export type VideoFormat = "webm" | "mp4";
export type VideoState = {
  timeLeft: number;
  recordedChunks: Blob[];
  recordingState: RecordingState;
};
export type RecordingState = "idle" | "recording" | "paused";
export type MediaDeviceInfo = globalThis.MediaDeviceInfo;