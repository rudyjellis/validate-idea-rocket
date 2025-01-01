import { useState, useEffect } from "react";
import type { VideoRecorderProps } from "../types";
import CameraSelector from "../CameraSelector";
import VideoPreview from "../VideoPreview";
import RecordingControls from "../RecordingControls";
import { useVideoRecording } from "../hooks/useVideoRecording";
import { useCameraDevices } from "../hooks/useCameraDevices";

const DesktopVideoRecorder = ({ maxDuration = 30, onRecordingComplete }: VideoRecorderProps) => {
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
    resetRecording,
  } = useVideoRecording();

  const { cameras, selectedCamera, setSelectedCamera } = useCameraDevices();

  useEffect(() => {
    const initCamera = async () => {
      try {
        if (cameras.length > 0) {
          console.log("Desktop: Setting first available camera");
          const firstCamera = cameras[0].deviceId;
          setSelectedCamera(firstCamera);
          await initializeStream(firstCamera);
        } else {
          console.log("No cameras available");
        }
      } catch (error) {
        console.error("Error initializing camera:", error);
      }
    };

    initCamera();
  }, [cameras]);

  const handleCameraChange = async (deviceId: string) => {
    console.log("Camera changed to:", deviceId);
    if (recordingState !== "idle") {
      stopRecording();
    }
    
    setSelectedCamera(deviceId);
    await initializeStream(deviceId);
  };

  const handleStartRecording = async () => {
    console.log("Starting recording with camera:", selectedCamera);
    if (!selectedCamera) {
      console.error("No camera selected");
      return;
    }
    
    setIsPlayingBack(false);
    await startRecording(selectedCamera);
  };

  const handlePlayback = () => {
    console.log("Starting playback");
    setIsPlayingBack(true);
    
    if (videoRef.current) {
      videoRef.current.onended = () => {
        console.log("Playback ended");
        setIsPlayingBack(false);
      };
    }
  };

  const handleStopPlayback = () => {
    console.log("Stopping playback");
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlayingBack(false);
  };

  const handleDownload = (format: "webm" | "mp4") => {
    downloadVideo(recordedChunks, format);
  };

  return (
    <div className="w-full">
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
          onPlayback={recordedChunks.length > 0 ? handlePlayback : undefined}
          onStopPlayback={handleStopPlayback}
        />
      </div>

      <div>
        <RecordingControls
          recordingState={recordingState}
          onStartRecording={handleStartRecording}
          onStopRecording={stopRecording}
          onPauseRecording={pauseRecording}
          onResumeRecording={resumeRecording}
          onDownload={handleDownload}
          onPlayback={handlePlayback}
          onStopPlayback={handleStopPlayback}
          hasRecording={recordedChunks.length > 0}
          isPlayingBack={isPlayingBack}
        />
      </div>
    </div>
  );
};

export default DesktopVideoRecorder;
