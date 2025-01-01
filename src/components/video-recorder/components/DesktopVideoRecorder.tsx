import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import CameraSelector from "../CameraSelector";
import RecordingControls from "../RecordingControls";
import { useVideoRecording } from "../hooks/useVideoRecording";
import { useCameraDevices } from "../hooks/useCameraDevices";
import CameraInitializer from "./desktop/CameraInitializer";
import VideoPreviewContainer from "./desktop/VideoPreviewContainer";
import type { VideoRecorderProps } from "../types";

const DesktopVideoRecorder = ({ maxDuration = 30, onRecordingComplete }: VideoRecorderProps) => {
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const { toast } = useToast();
  
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
  } = useVideoRecording(maxDuration);

  const { cameras, selectedCamera, setSelectedCamera } = useCameraDevices();

  const handleCameraChange = async (deviceId: string) => {
    try {
      console.log("[DesktopVideoRecorder] Changing camera to:", deviceId);
      setIsInitializing(true);
      
      if (recordingState !== "idle") {
        stopRecording();
      }
      
      setSelectedCamera(deviceId);
      await initializeStream(deviceId);
    } catch (error) {
      console.error("[DesktopVideoRecorder] Camera switch error:", error);
      toast({
        title: "Camera Switch Error",
        description: "Failed to switch cameras. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleStartRecording = async () => {
    console.log("Starting recording with camera:", selectedCamera);
    if (!selectedCamera) {
      console.error("No camera selected");
      toast({
        title: "No Camera Selected",
        description: "Please select a camera before recording.",
        variant: "destructive",
      });
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
    console.log("Initiating download with format:", format);
    downloadVideo(recordedChunks, format);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <CameraInitializer
        cameras={cameras}
        setSelectedCamera={setSelectedCamera}
        initializeStream={initializeStream}
        setIsInitializing={setIsInitializing}
        videoRef={videoRef}
      />
      
      <CameraSelector
        cameras={cameras}
        selectedCamera={selectedCamera}
        onCameraChange={handleCameraChange}
        disabled={recordingState !== "idle" || isInitializing}
      />
      
      <VideoPreviewContainer
        videoRef={videoRef}
        isInitializing={isInitializing}
        recordingState={recordingState}
        timeLeft={timeLeft}
        isPlayingBack={isPlayingBack}
        recordedChunks={recordedChunks}
        onPlayback={handlePlayback}
        onStopPlayback={handleStopPlayback}
        onDownload={handleDownload}
      />

      <div className="mt-4">
        <RecordingControls
          recordingState={recordingState}
          onStartRecording={handleStartRecording}
          onStopRecording={stopRecording}
          onPauseRecording={pauseRecording}
          onResumeRecording={resumeRecording}
          onDownload={handleDownload}
          onPlayback={handlePlayback}
          hasRecording={recordedChunks.length > 0}
          isPlayingBack={isPlayingBack}
        />
      </div>
    </div>
  );
};

export default DesktopVideoRecorder;