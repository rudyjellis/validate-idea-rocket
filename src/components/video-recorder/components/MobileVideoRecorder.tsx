import { useState, useEffect } from "react";
import type { VideoRecorderProps } from "../types";
import VideoPreview from "../VideoPreview";
import { useVideoRecording } from "../hooks/useVideoRecording";
import { useCameraDevices } from "../hooks/useCameraDevices";
import { useToast } from "@/components/ui/use-toast";
import MobileRecordingControls from "./MobileRecordingControls";

const MobileVideoRecorder = ({ maxDuration = 30, onRecordingComplete }: VideoRecorderProps) => {
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

  useEffect(() => {
    const initCamera = async () => {
      try {
        setIsInitializing(true);
        console.log("Mobile: Attempting to initialize camera");
        
        const frontCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('front')
        );

        if (frontCamera) {
          console.log("Mobile: Setting front camera");
          setSelectedCamera(frontCamera.deviceId);
          await initializeStream(frontCamera.deviceId);
          console.log("Mobile: Front camera initialized successfully");
        } else if (cameras.length > 0) {
          console.log("Mobile: No front camera found, using first available camera");
          setSelectedCamera(cameras[0].deviceId);
          await initializeStream(cameras[0].deviceId);
          console.log("Mobile: Camera initialized successfully");
        } else {
          console.log("No cameras available");
          toast({
            title: "Camera Access Required",
            description: "Please allow camera access to use this feature. You might need to check your browser settings.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error initializing camera:", error);
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
  }, [cameras.length, setSelectedCamera, initializeStream, toast]);

  const handleStartRecording = async () => {
    console.log("Starting mobile recording with camera:", selectedCamera);
    if (!selectedCamera) {
      console.error("No camera selected");
      toast({
        title: "Camera Error",
        description: "Please allow camera access to start recording.",
        variant: "destructive",
      });
      return;
    }
    
    setIsPlayingBack(false);
    await startRecording(selectedCamera);
  };

  const handleDownload = (format: "webm" | "mp4") => {
    console.log("Initiating mobile download with format:", format);
    downloadVideo(recordedChunks, format);
  };

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