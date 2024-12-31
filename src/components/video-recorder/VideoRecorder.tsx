import { useState, useEffect } from "react";
import type { VideoRecorderProps } from "./types";
import CameraSelector from "./CameraSelector";
import VideoPreview from "./VideoPreview";
import RecordingControls from "./RecordingControls";
import { useVideoRecording } from "./hooks/useVideoRecording";
import { useCameraDevices } from "./hooks/useCameraDevices";

const VideoRecorder = ({ maxDuration = 30, onRecordingComplete }: VideoRecorderProps) => {
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  
  const {
    videoRef,
    recordingState,
    recordedChunks,
    timeLeft,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    initializeStream,
    downloadVideo,
    playRecording,
  } = useVideoRecording();

  const { cameras, selectedCamera, setSelectedCamera } = useCameraDevices();

  useEffect(() => {
    if (selectedCamera) {
      console.log("Initializing stream for selected camera:", selectedCamera);
      initializeStream(selectedCamera);
    }
  }, [selectedCamera, initializeStream]);

  const handleCameraChange = (deviceId: string) => {
    console.log("Camera changed to:", deviceId);
    setSelectedCamera(deviceId);
    if (recordingState !== "idle") {
      stopRecording();
    }
  };

  const handleStartRecording = () => {
    console.log("Starting recording with camera:", selectedCamera);
    setIsPlayingBack(false);
    startRecording(selectedCamera);
  };

  const handlePlayback = () => {
    console.log("Starting playback");
    setIsPlayingBack(true);
    playRecording();
    if (videoRef.current) {
      videoRef.current.onended = () => {
        console.log("Playback ended");
        setIsPlayingBack(false);
      };
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="w-full max-w-md">
        <CameraSelector
          cameras={cameras}
          selectedCamera={selectedCamera}
          onCameraChange={handleCameraChange}
          disabled={recordingState !== "idle"}
        />
        
        <div className="mt-4">
          <VideoPreview
            ref={videoRef}
            isRecording={recordingState === "recording"}
            timeLeft={timeLeft}
            recordingState={recordingState}
            isPlayingBack={isPlayingBack}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 items-center">
        <RecordingControls
          recordingState={recordingState}
          onStartRecording={handleStartRecording}
          onStopRecording={stopRecording}
          onPauseRecording={pauseRecording}
          onResumeRecording={resumeRecording}
          onDownload={downloadVideo}
          onPlayback={handlePlayback}
          hasRecording={recordedChunks.length > 0}
        />
      </div>
    </div>
  );
};

export default VideoRecorder;