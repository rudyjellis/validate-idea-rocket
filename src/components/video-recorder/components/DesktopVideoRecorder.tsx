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

  // Modified useEffect to prevent initialization loop
  useEffect(() => {
    let isMounted = true;

    const initCamera = async () => {
      try {
        if (!isMounted) return;
        
        console.log("[DesktopVideoRecorder] Starting camera initialization");
        setIsInitializing(true);

        // Only initialize if we have cameras and no stream is active
        if (cameras.length > 0 && !videoRef.current?.srcObject) {
          console.log("[DesktopVideoRecorder] Found cameras, selecting first camera");
          const firstCamera = cameras[0].deviceId;
          setSelectedCamera(firstCamera);
          await initializeStream(firstCamera);
          console.log("[DesktopVideoRecorder] Camera initialized successfully");
        } else if (cameras.length === 0) {
          console.log("[DesktopVideoRecorder] No cameras available");
          toast({
            title: "No cameras found",
            description: "Please connect a camera and allow access to use this feature.",
            variant: "destructive",
          });
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.error("[DesktopVideoRecorder] Camera initialization error:", error);
        toast({
          title: "Camera Access Error",
          description: "Please make sure you've granted camera permissions and try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initCamera();

    // Cleanup function
    return () => {
      isMounted = false;
      console.log("[DesktopVideoRecorder] Cleaning up camera initialization");
    };
  }, [cameras.length]); // Only re-run when cameras array length changes

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