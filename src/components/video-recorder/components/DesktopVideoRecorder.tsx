import { useState, useEffect } from "react";
import type { VideoRecorderProps } from "../types";
import CameraSelector from "../CameraSelector";
import VideoPreview from "../VideoPreview";
import RecordingControls from "../RecordingControls";
import { useVideoRecording } from "../hooks/useVideoRecording";
import { useCameraDevices } from "../hooks/useCameraDevices";
import { useToast } from "@/components/ui/use-toast";

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

  useEffect(() => {
    const initCamera = async () => {
      try {
        setIsInitializing(true);
        console.log("Desktop: Attempting to initialize camera");
        
        if (cameras.length > 0) {
          console.log("Desktop: Setting first available camera");
          const firstCamera = cameras[0].deviceId;
          setSelectedCamera(firstCamera);
          await initializeStream(firstCamera);
          console.log("Desktop: Camera initialized successfully");
        } else {
          console.log("No cameras available");
          toast({
            title: "No cameras found",
            description: "Please connect a camera and allow access to use this feature.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error initializing camera:", error);
        toast({
          title: "Camera Access Error",
          description: "Please make sure you've granted camera permissions and try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initCamera();
  }, [cameras, setSelectedCamera, initializeStream, toast]);

  const handleCameraChange = async (deviceId: string) => {
    try {
      console.log("Camera changed to:", deviceId);
      setIsInitializing(true);
      
      if (recordingState !== "idle") {
        stopRecording();
      }
      
      setSelectedCamera(deviceId);
      await initializeStream(deviceId);
    } catch (error) {
      console.error("Error changing camera:", error);
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
      <CameraSelector
        cameras={cameras}
        selectedCamera={selectedCamera}
        onCameraChange={handleCameraChange}
        disabled={recordingState !== "idle" || isInitializing}
      />
      
      <div className="mt-4 relative aspect-video bg-black rounded-lg overflow-hidden">
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-white">Initializing camera...</div>
          </div>
        )}
        <VideoPreview
          ref={videoRef}
          isRecording={recordingState === "recording"}
          timeLeft={timeLeft}
          recordingState={recordingState}
          isPlayingBack={isPlayingBack}
          onPlayback={recordedChunks.length > 0 ? handlePlayback : undefined}
          onStopPlayback={handleStopPlayback}
          onDownload={handleDownload}
        />
      </div>

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
