import { useState, useEffect } from "react";
import type { VideoRecorderProps } from "../types";
import VideoPreview from "../VideoPreview";
import { useVideoRecording } from "../hooks/useVideoRecording";
import { useCameraDevices } from "../hooks/useCameraDevices";
import { useToast } from "@/components/ui/use-toast";

const MobileVideoRecorder = ({ maxDuration = 30, onRecordingComplete }: VideoRecorderProps) => {
  const [isPlayingBack, setIsPlayingBack] = useState(false);
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
        
        stream.getTracks().forEach(track => track.stop());
        
        console.log("Camera permissions granted on mobile");

        if (cameras.length > 0) {
          console.log("Mobile: Setting first available camera");
          const frontCamera = cameras.find(camera => 
            camera.label.toLowerCase().includes('front')
          ) || cameras[0];
          setSelectedCamera(frontCamera.deviceId);
          await initializeStream(frontCamera.deviceId);
        } else {
          console.log("No cameras available");
          toast({
            title: "No cameras found",
            description: "Please ensure camera access is enabled.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error requesting camera permissions:", error);
        toast({
          title: "Camera Access Required",
          description: "Please enable camera access to use this feature.",
          variant: "destructive",
        });
      }
    };

    requestPermissions();
  }, [cameras, setSelectedCamera, initializeStream, toast]);

  const handleTapToRecord = async () => {
    console.log("Tap to record triggered on mobile");
    if (recordingState === "idle" && selectedCamera) {
      await startRecording(selectedCamera);
    } else if (recordingState === "recording") {
      stopRecording();
    }
  };

  const handleDownload = (format: 'webm' | 'mp4') => {
    console.log("Initiating download on mobile with format:", format);
    downloadVideo(recordedChunks, format);
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
          onDownload={handleDownload}
        />
      </div>
    </div>
  );
};

export default MobileVideoRecorder;