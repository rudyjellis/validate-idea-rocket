import { type VideoFormat } from "../types";

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const initializeMediaStream = async (selectedCamera: string) => {
  try {
    console.log("Initializing media stream for camera:", selectedCamera);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: selectedCamera },
      audio: true,
    });
    console.log("Media stream initialized successfully");
    return stream;
  } catch (error) {
    console.error("Error accessing media devices:", error);
    throw error;
  }
};

export const stopMediaStream = (stream: MediaStream | null) => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    console.log("Media stream stopped");
  }
};

export const createDownloadLink = (
  recordedChunks: Blob[],
  format: VideoFormat,
  counter: number
): { url: string; fileName: string } => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `recording-${timestamp}-${counter}.${format}`;
  const mimeType = format === "webm" ? "video/webm" : "video/mp4";
  const blob = new Blob(recordedChunks, { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  return { url, fileName };
};