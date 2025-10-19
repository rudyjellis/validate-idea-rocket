import { useEffect } from "react";
import type { VideoRecorderProps } from "../types";
import VideoPreview from "../VideoPreview";
import { useRecorderLogic } from "../hooks/useRecorderLogic";
import { useToast } from "@/components/ui/use-toast";
import MobileRecordingControls from "./MobileRecordingControls";
import { createVideoRecorderLogger } from "@/utils/logger";

const log = createVideoRecorderLogger('MobileVideoRecorder');

const MobileVideoRecorder = ({ maxDuration = 30 }: VideoRecorderProps) => {
  const {
    isPlayingBack,
    isInitializing,
    setIsInitializing,
    videoRef,
    recordingState,
    timeLeft,
    cameras,
    selectedCamera,
    setSelectedCamera,
    initializeStream,
    pauseRecording,
    stopRecording,
    handleDownload,
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
      {isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white">Initializing camera...</div>
        </div>
      )}
      <div className="absolute inset-0">
        <VideoPreview
          ref={videoRef}
          isRecording={recordingState === "recording"}
          timeLeft={timeLeft}
          recordingState={recordingState}
          isPlayingBack={isPlayingBack}
        />
      </div>

      <MobileRecordingControls
        recordingState={recordingState}
        onTapToPause={pauseRecording}
        onTapToStop={stopRecording}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default MobileVideoRecorder;