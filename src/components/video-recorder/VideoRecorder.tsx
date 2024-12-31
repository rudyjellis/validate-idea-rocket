import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import CameraSelector from "./CameraSelector";
import VideoPreview from "./VideoPreview";
import RecordingControls from "./RecordingControls";
import { DownloadOptions } from "./components/DownloadOptions";
import { useVideoRecording } from "./hooks/useVideoRecording";
import { useCameraDevices } from "./hooks/useCameraDevices";

const VideoRecorder = () => {
  const {
    videoRef,
    recordingState,
    recordedChunks,
    timeLeft,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useVideoRecording();

  const { cameras, selectedCamera, setSelectedCamera } = useCameraDevices();
  const [downloadFormat, setDownloadFormat] = useState<'webm' | 'mp4'>('webm');
  const { toast } = useToast();

  const handleCameraChange = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    if (recordingState !== "idle") {
      stopRecording();
    }
  };

  const downloadVideo = () => {
    if (recordedChunks.length === 0) return;

    const mimeType = downloadFormat === 'webm' ? 'video/webm' : 'video/mp4';
    const blob = new Blob(recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = `recorded-video.${downloadFormat}`;
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Download started",
      description: `Your video will be downloaded in ${downloadFormat.toUpperCase()} format`,
    });
  };

  const handleStartRecording = () => startRecording(selectedCamera);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="w-full max-w-md">
        <CameraSelector
          cameras={cameras}
          selectedCamera={selectedCamera}
          onCameraChange={handleCameraChange}
          disabled={recordingState !== "idle"}
        />
        
        <div className="relative">
          <AspectRatio ratio={9/16} className="bg-black rounded-lg border border-gray-200 overflow-hidden">
            <VideoPreview
              ref={videoRef}
              isRecording={recordingState === "recording"}
              timeLeft={timeLeft}
            />
          </AspectRatio>
        </div>
      </div>

      <div className="flex flex-col gap-2 items-center">
        {recordedChunks.length > 0 && (
          <DownloadOptions
            downloadFormat={downloadFormat}
            onFormatChange={setDownloadFormat}
          />
        )}
        
        <RecordingControls
          recordingState={recordingState}
          onStartRecording={handleStartRecording}
          onStopRecording={stopRecording}
          onPauseRecording={pauseRecording}
          onResumeRecording={resumeRecording}
          onDownload={downloadVideo}
          hasRecording={recordedChunks.length > 0}
        />
      </div>
    </div>
  );
};

export default VideoRecorder;