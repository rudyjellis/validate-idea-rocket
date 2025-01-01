import { useState, useEffect } from "react";
import type { VideoRecorderProps } from "../types";
import VideoPreview from "../VideoPreview";
import { useVideoRecording } from "../hooks/useVideoRecording";
import { useCameraDevices } from "../hooks/useCameraDevices";
import { useToast } from "@/components/ui/use-toast";

const MobileVideoRecorder = ({ maxDuration = 30, onRecordingComplete }: VideoRecorderProps) => {
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
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
    resetRecording,
  } = useVideoRecording();

  const { cameras, selectedCamera, setSelectedCamera } = useCameraDevices();

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        console.log("Requesting camera permissions on mobile");
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: true 
        });
        
        // Stop the stream immediately after getting permission
        stream.getTracks().forEach(track => track.stop());
        
        setHasPermission(true);
        console.log("Camera permissions granted on mobile");

        // Initialize with the first available camera
        if (cameras.length > 0) {
          console.log("Mobile: Setting first available camera");
          const firstCamera = cameras[0].deviceId;
          setSelectedCamera(firstCamera);
          await initializeStream(firstCamera);
        }
      } catch (error) {
        console.error("Error requesting camera permissions:", error);
        setHasPermission(false);
        toast({
          variant: "destructive",
          title: "Camera Access Required",
          description: "Please enable camera access to use this feature.",
        });
      }
    };

    requestPermissions();
  }, [cameras, setSelectedCamera, toast]);

  const handleTapToRecord = async () => {
    console.log("Tap to record triggered on mobile");
    if (recordingState === "idle" && selectedCamera) {
      await startRecording(selectedCamera);
    } else if (recordingState === "recording") {
      stopRecording();
    }
  };

  const handlePlayback = () => {
    console.log("Starting mobile playback");
    setIsPlayingBack(true);
    
    if (videoRef.current) {
      videoRef.current.onended = () => {
        console.log("Mobile playback ended");
        setIsPlayingBack(false);
      };
    }
  };

  const handleStopPlayback = () => {
    console.log("Stopping mobile playback");
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlayingBack(false);
  };

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-lg font-medium mb-2">Camera Access Required</p>
        <p className="text-sm text-gray-600">
          Please enable camera access in your browser settings to use this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="absolute inset-0">
        <VideoPreview
          ref={videoRef}
          isRecording={recordingState === "recording"}
          timeLeft={timeLeft}
          recordingState={recordingState}
          isPlayingBack={isPlayingBack}
          onTapToRecord={handleTapToRecord}
          onTapToPause={pauseRecording}
          onTapToStop={stopRecording}
          onTapToResume={resumeRecording}
          onPlayback={recordedChunks.length > 0 ? handlePlayback : undefined}
          onStopPlayback={handleStopPlayback}
        />
      </div>
    </div>
  );
};

export default MobileVideoRecorder;