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
    playRecording,
    resetRecording,
  } = useVideoRecording();

  const { cameras, selectedCamera, setSelectedCamera } = useCameraDevices();

  useEffect(() => {
    const initCamera = async () => {
      if (cameras.length === 0) {
        console.log("No cameras available");
        return;
      }

      if (!selectedCamera) {
        console.log("Desktop: Setting first available camera");
        setSelectedCamera(cameras[0].deviceId);
        await initializeStream(cameras[0].deviceId).catch(error => {
          console.error("Error initializing desktop camera:", error);
        });
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
    await initializeStream(deviceId).catch(error => {
      console.error("Error changing camera:", error);
    });
  };

  const handleStartRecording = async () => {
    console.log("Starting recording with camera:", selectedCamera);
    if (!selectedCamera) {
      console.error("No camera selected");
      return;
    }
    
    setIsPlayingBack(false);
    try {
      await startRecording(selectedCamera);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
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

  const handleStopPlayback = () => {
    console.log("Stopping playback");
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlayingBack(false);
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
          onDownload={downloadVideo}
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