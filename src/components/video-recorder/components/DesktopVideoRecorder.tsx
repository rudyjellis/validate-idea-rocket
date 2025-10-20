import CameraSelector from "../CameraSelector";
import RecordingControls from "../RecordingControls";
import { useRecorderLogic } from "../hooks/useRecorderLogic";
import CameraInitializerFixed from "./CameraInitializerFixed";
import VideoPreviewContainer from "./desktop/VideoPreviewContainer";
import CameraDebugInfo from "./CameraDebugInfo";
import type { VideoRecorderProps } from "../types";

const DesktopVideoRecorder = ({ maxDuration = 30 }: VideoRecorderProps) => {
  const {
    isPlayingBack,
    isInitializing,
    setIsInitializing,
    videoRef,
    recordingState,
    recordedChunks,
    timeLeft,
    cameras,
    selectedCamera,
    setSelectedCamera,
    handleStartRecording,
    handleDownload,
    handlePlayback,
    handleStopPlayback,
    handleCameraChange,
    pauseRecording,
    resumeRecording,
    stopRecording,
    initializeStream,
  } = useRecorderLogic({ maxDuration });


  return (
    <div className="w-full max-w-4xl mx-auto">
      <CameraInitializerFixed
        cameras={cameras}
        selectedCamera={selectedCamera}
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
      
      <CameraDebugInfo
        cameras={cameras}
        selectedCamera={selectedCamera}
        isInitializing={isInitializing}
        videoRef={videoRef}
      />
    </div>
  );
};

export default DesktopVideoRecorder;