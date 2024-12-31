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

  // Initialize camera selection when component mounts
  useEffect(() => {
    const initCamera = async () => {
      if (cameras.length === 0) {
        console.log("No cameras available");
        return;
      }

      // For mobile devices
      if (isMobile) {
        const frontCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('front') ||
          camera.label.toLowerCase().includes('user') ||
          camera.label.toLowerCase().includes('selfie')
        );

        if (frontCamera) {
          console.log("Setting front camera:", frontCamera.deviceId);
          setSelectedCamera(frontCamera.deviceId);
          try {
            await initializeStream(frontCamera.deviceId);
          } catch (error) {
            console.error("Error initializing front camera:", error);
          }
        } else {
          console.log("No front camera found, using first available camera");
          setSelectedCamera(cameras[0].deviceId);
          try {
            await initializeStream(cameras[0].deviceId);
          } catch (error) {
            console.error("Error initializing fallback camera:", error);
          }
        }
      } 
      // For desktop devices
      else if (!selectedCamera) {
        console.log("Desktop: Setting first available camera");
        setSelectedCamera(cameras[0].deviceId);
        try {
          await initializeStream(cameras[0].deviceId);
        } catch (error) {
          console.error("Error initializing desktop camera:", error);
        }
      }
    };

    initCamera();
  }, [cameras, isMobile]); // Only re-run when cameras list or platform changes

  const handleCameraChange = async (deviceId: string) => {
    console.log("Camera changed to:", deviceId);
    if (recordingState !== "idle") {
      stopRecording();
    }
    
    setSelectedCamera(deviceId);
    try {
      await initializeStream(deviceId);
    } catch (error) {
      console.error("Error changing camera:", error);
    }
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

  const handleTapToRecord = async () => {
    console.log("Tap to record triggered");
    if (recordingState === "idle") {
      await handleStartRecording();
    } else if (recordingState === "recording") {
      stopRecording();
    }
  };

  const handleTapToPause = () => {
    console.log("Tap to pause triggered");
    if (recordingState === "recording") {
      pauseRecording();
    }
  };

  const handleTapToStop = () => {
    console.log("Tap to stop triggered");
    if (recordingState === "recording" || recordingState === "paused") {
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
            onTapToPause={handleTapToPause}
            onTapToStop={handleTapToStop}
            onTapToResume={resumeRecording}
          />
        </div>
      </div>

      {!isMobile && (
        <div>
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
      )}
    </div>
  );
};

export default VideoRecorder;