import { useState } from "react";
import type { VideoRecorderProps } from "../types";
import VideoPreview from "../VideoPreview";
import { useVideoRecording } from "../hooks/useVideoRecording";
import { useCameraDevices } from "../hooks/useCameraDevices";

const MobileVideoRecorder = ({ maxDuration = 30, onRecordingComplete }: VideoRecorderProps) => {
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  
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
    resetRecording,
  } = useVideoRecording();

  const { cameras, selectedCamera, setSelectedCamera } = useCameraDevices();

  const handleTapToRecord = async () => {
    console.log("Tap to record triggered");
    if (recordingState === "idle") {
      await handleStartRecording();
    } else if (recordingState === "recording") {
      stopRecording();
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

  const handleStopPlayback = () => {
    console.log("Stopping playback");
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
        />
      </div>
    </div>
  );
};

export default MobileVideoRecorder;