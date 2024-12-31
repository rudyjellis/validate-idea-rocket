import { useState, useEffect } from "react";
import type { VideoRecorderProps } from "./types";
import CameraSelector from "./CameraSelector";
import VideoPreview from "./VideoPreview";
import RecordingControls from "./RecordingControls";
import { useVideoRecording } from "./hooks/useVideoRecording";
import { useCameraDevices } from "./hooks/useCameraDevices";
import { useIsMobile } from "@/hooks/use-mobile";

const VideoRecorder = ({ maxDuration = 30, onRecordingComplete }: VideoRecorderProps) => {
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const isMobile = useIsMobile();
  
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

  // Initialize stream when component mounts or camera changes
  useEffect(() => {
    const initCamera = async () => {
      if (cameras.length > 0) {
        // For mobile, try to find the front camera
        if (isMobile) {
          const frontCamera = cameras.find(camera => 
            camera.label.toLowerCase().includes('front') ||
            camera.label.toLowerCase().includes('user') ||
            camera.label.toLowerCase().includes('selfie')
          );
          if (frontCamera && frontCamera.deviceId !== selectedCamera) {
            console.log("Setting front camera:", frontCamera.deviceId);
            setSelectedCamera(frontCamera.deviceId);
          } else if (!selectedCamera) {
            console.log("No front camera found, using first available camera");
            setSelectedCamera(cameras[0].deviceId);
          }
        } else if (!selectedCamera) {
          setSelectedCamera(cameras[0].deviceId);
        }
      }
    };

    initCamera();
  }, [cameras, isMobile]);

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
    if (!selectedCamera) {
      console.error("No camera selected");
      return;
    }
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

  const handleTapToRecord = () => {
    console.log("Tap to record triggered");
    if (recordingState === "idle") {
      handleStartRecording();
    } else if (recordingState === "recording") {
      stopRecording();
    }
  };

  return (
    <div className={`flex flex-col ${isMobile ? 'h-full' : ''}`}>
      <div className={`w-full ${isMobile ? 'flex-1 relative' : 'max-w-md mx-auto'}`}>
        {(!isMobile || recordingState === "idle") && (
          <CameraSelector
            cameras={cameras}
            selectedCamera={selectedCamera}
            onCameraChange={handleCameraChange}
            disabled={recordingState !== "idle"}
          />
        )}
        
        <div className={`${isMobile ? 'absolute inset-0' : 'mt-4'}`}>
          <VideoPreview
            ref={videoRef}
            isRecording={recordingState === "recording"}
            timeLeft={timeLeft}
            recordingState={recordingState}
            isPlayingBack={isPlayingBack}
            onTapToRecord={handleTapToRecord}
          />
        </div>
      </div>

      <div className={`${isMobile ? 'fixed bottom-0 left-0 right-0 pb-6 bg-gradient-to-t from-black/80 to-transparent pt-20' : ''}`}>
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