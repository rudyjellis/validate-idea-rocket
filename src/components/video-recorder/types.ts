export type MediaDeviceInfo = {
  deviceId: string;
  groupId: string;
  kind: string;
  label: string;
};

export type RecordingState = "idle" | "recording" | "paused";