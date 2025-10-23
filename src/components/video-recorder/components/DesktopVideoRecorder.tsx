import CameraSelector from "../CameraSelector";
import MicrophoneSelector from "../MicrophoneSelector";
import RecordingControls from "../RecordingControls";
import { useRecorderLogic } from "../hooks/useRecorderLogic";
import { useVideoUpload } from "@/hooks/useVideoUpload";
import CameraInitializerFixed from "./CameraInitializerFixed";
import VideoPreviewContainer from "./desktop/VideoPreviewContainer";
import CameraDebugInfo from "./CameraDebugInfo";
import { TranscriptionIndicator } from "./TranscriptionIndicator";
import type { VideoRecorderProps } from "../types";
import type { VideoElementRef } from "./VideoElement";

const DesktopVideoRecorder = ({ maxDuration = 30 }: VideoRecorderProps) => {
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
    microphones,
    selectedMicrophone,
    setSelectedMicrophone,
    transcript,
    isTranscribing,
    isTranscriptionSupported,
    transcriptionError,
    handleStartRecording,
    handleCountdownComplete,
    handleDownload,
    handlePlayback,
    handleStopPlayback,
    handleCameraChange,
    handleMicrophoneChange,
    pauseRecording,
    resumeRecording,
    stopRecording,
    restartRecording,
    initializeStream,
    showCountdown,
  } = useRecorderLogic({ maxDuration });

  const { uploadAndGenerateMVP, uploadStatus } = useVideoUpload();

  const handleUpload = () => {
    uploadAndGenerateMVP(recordedChunks, transcript);
  };


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

      <MicrophoneSelector
        microphones={microphones}
        selectedMicrophone={selectedMicrophone}
        onMicrophoneChange={handleMicrophoneChange}
        disabled={recordingState !== "idle" || isInitializing}
      />

      {/* Show transcription status during recording */}
      {(recordingState === "recording" || recordingState === "paused" || recordedChunks.length > 0) && (
        <div className="mb-4">
          <TranscriptionIndicator
            isTranscribing={isTranscribing}
            isSupported={isTranscriptionSupported}
            error={transcriptionError}
            transcriptLength={transcript.length}
          />
        </div>
      )}

      <VideoPreviewContainer
        videoRef={videoRef}
        isInitializing={isInitializing}
        recordingState={recordingState}
        timeLeft={timeLeft}
        isPlayingBack={isPlayingBack}
        recordedChunks={recordedChunks}
        currentStream={currentStream}
        showCountdown={showCountdown}
        onCountdownComplete={handleCountdownComplete}
        onPlayback={handlePlayback}
        onStopPlayback={handleStopPlayback}
        onDownload={handleDownload}
        onStartRecording={handleStartRecording}
        onTapToStop={stopRecording}
        onTapToPause={pauseRecording}
        onTapToResume={resumeRecording}
        onRestart={restartRecording}
      />

      <div className="mt-4">
        <RecordingControls
          recordingState={recordingState}
          onStartRecording={handleStartRecording}
          onStopRecording={stopRecording}
          onPauseRecording={pauseRecording}
          onResumeRecording={resumeRecording}
          onRestart={restartRecording}
          onDownload={handleDownload}
          onPlayback={handlePlayback}
          onUpload={handleUpload}
          uploadStatus={uploadStatus}
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