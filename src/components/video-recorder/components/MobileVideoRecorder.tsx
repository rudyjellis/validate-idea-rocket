import { useEffect } from "react";
import type { VideoRecorderProps } from "../types";
import VideoPreview from "../VideoPreview";
import type { VideoElementRef } from "../components/VideoElement";
import { useRecorderLogic } from "../hooks/useRecorderLogic";
import { useToast } from "@/components/ui/use-toast";
import MobileRecordingControls from "./MobileRecordingControls";
import MobileLoadingOverlay from "./MobileLoadingOverlay";
import { createVideoRecorderLogger } from "@/utils/logger";

const log = createVideoRecorderLogger('MobileVideoRecorder');

const MobileVideoRecorder = ({ maxDuration = 30 }: VideoRecorderProps) => {
  const {
    isPlayingBack,
    isInitializing,
    setIsInitializing,
    videoRef,
    recordingState,
    recordedChunks,
    timeLeft,
    currentStream,
    cameras,
    selectedCamera,
    setSelectedCamera,
    initializeStream,
    handleStartRecording,
    handleCountdownComplete,
    pauseRecording,
    resumeRecording,
    stopRecording,
    handleDownload,
    showCountdown,
    toast,
  } = useRecorderLogic({ maxDuration });

  useEffect(() => {
    const initCamera = async () => {
      if (!selectedCamera || cameras.length === 0) return;
      
      try {
        setIsInitializing(true);
        log.log("Mobile: Initializing camera:", selectedCamera);
        
        // Prefer front camera on mobile if available
        const frontCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('front')
        );
        const cameraToUse = frontCamera || cameras.find(c => c.deviceId === selectedCamera);
        
        if (cameraToUse && cameraToUse.deviceId !== selectedCamera) {
          setSelectedCamera(cameraToUse.deviceId);
        }
        
        await initializeStream(cameraToUse?.deviceId || selectedCamera);
        log.log("Mobile: Camera initialized successfully");
      } catch (error) {
        log.error("Error initializing camera:", error);
        toast({
          title: "Camera Error",
          description: "Unable to access camera. Please check permissions and try again.",
          variant: "destructive",
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initCamera();
  }, [selectedCamera, cameras, setSelectedCamera, initializeStream, toast]);

  return (
    <div className="relative w-full h-full bg-black">
      <MobileLoadingOverlay 
        isInitializing={isInitializing}
        message="Setting up camera..."
      />
      
      <div className="absolute inset-0">
        <VideoPreview
          ref={videoRef}
          isRecording={recordingState === "recording"}
          timeLeft={timeLeft}
          recordingState={recordingState}
          isPlayingBack={isPlayingBack}
          currentStream={currentStream}
          hasRecording={recordedChunks.length > 0}
          recordedBlob={recordedChunks.length > 0 ? new Blob(recordedChunks, { type: recordedChunks[0]?.type || 'video/webm' }) : null}
          showCountdown={showCountdown}
          onCountdownComplete={handleCountdownComplete}
          onTapToRecord={handleStartRecording}
          onTapToPause={pauseRecording}
          onTapToResume={resumeRecording}
          onTapToStop={stopRecording}
          onDownload={handleDownload}
        />
      </div>
    </div>
  );
};

export default MobileVideoRecorder;