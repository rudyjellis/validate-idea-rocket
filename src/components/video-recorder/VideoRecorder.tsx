import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import CameraSelector from "./CameraSelector";
import VideoPreview from "./VideoPreview";
import RecordingControls from "./RecordingControls";
import { useVideoRecording } from "./hooks/useVideoRecording";
import { useCameraDevices } from "./hooks/useCameraDevices";

const VideoRecorder = () => {
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
    resetRecording,
  } = useVideoRecording();

  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const { cameras, selectedCamera, setSelectedCamera } = useCameraDevices();

  useEffect(() => {
    if (selectedCamera) {
      initializeStream(selectedCamera);
    }
  }, [selectedCamera]);

  const handleCameraChange = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    if (recordingState !== "idle") {
      stopRecording();
    }
  };

  const handleStartRecording = () => {
    setIsPlayingBack(false);
    startRecording(selectedCamera);
  };

  const handlePlayback = () => {
    setIsPlayingBack(true);
    playRecording();
    if (videoRef.current) {
      videoRef.current.onended = () => {
        setIsPlayingBack(false);
        if (selectedCamera) {
          initializeStream(selectedCamera);
        }
      };
    }
  };

  const handleNewRecording = () => {
    resetRecording();
    setIsPlayingBack(false);
    if (selectedCamera) {
      initializeStream(selectedCamera);
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    if (selectedCamera) {
      initializeStream(selectedCamera);
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
          onStopRecording={handleStopRecording}
          onPauseRecording={pauseRecording}
          onResumeRecording={resumeRecording}
          onDownload={downloadVideo}
          onPlayback={handlePlayback}
          hasRecording={recordedChunks.length > 0}
          onNewRecording={handleNewRecording}
        />
      </div>
    </div>
  );
};

export default VideoRecorder;