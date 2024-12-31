export const initializeMediaStream = async (selectedCamera: string) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: selectedCamera },
      audio: true,
    });
    return stream;
  } catch (error) {
    console.error("Error accessing media devices:", error);
    throw error;
  }
};

export const stopMediaStream = (stream: MediaStream | null) => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
};