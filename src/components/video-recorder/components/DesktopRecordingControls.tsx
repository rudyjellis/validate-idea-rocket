import { Button } from "@/components/ui/button";
import { Video, StopCircle, Pause, Play, Download, RotateCcw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import UploadButton from "./UploadButton";
import type { RecordingState } from "../types";
import type { UploadStatus } from "@/hooks/useVideoUpload";

interface DesktopRecordingControlsProps {
  recordingState: RecordingState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onDownload: (format: 'webm' | 'mp4') => void;
  onPlayback: () => void;
  onStopPlayback?: () => void;
  onRestart?: () => void;
  onUpload?: () => void;
  uploadStatus?: UploadStatus;
  hasRecording: boolean;
  isPlayingBack?: boolean;
}

const DesktopRecordingControls = ({
  recordingState,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onUpload,
  uploadStatus = 'idle',
  onDownload,
  onPlayback,
  onStopPlayback,
  onRestart,
  hasRecording,
  isPlayingBack,
}: DesktopRecordingControlsProps) => {
  const renderControlButton = (
    onClick: () => void,
    icon: React.ReactNode,
    tooltip: string,
    variant: "default" | "secondary" | "destructive" | "outline" = "default",
    disabled: boolean = false
  ) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          variant={variant}
          size="icon"
          className="shadow-sm"
          disabled={disabled}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider>
      <div className="flex gap-2 mt-4 justify-center w-full bg-transparent">
        {recordingState === "idle" ? (
          <>
            {renderControlButton(
              onStartRecording,
              <Video className="h-5 w-5" />,
              "Start Recording"
            )}
            {hasRecording && !isPlayingBack && (
              renderControlButton(
                onPlayback,
                <Play className="h-5 w-5" />,
                "Play Recording",
                "secondary"
              )
            )}
            {hasRecording && isPlayingBack && onStopPlayback && (
              renderControlButton(
                onStopPlayback,
                <StopCircle className="h-5 w-5" />,
                "Stop Playback",
                "secondary"
              )
            )}
          </>
        ) : (
          <>
            {recordingState === "recording"
              ? renderControlButton(
                  onPauseRecording,
                  <Pause className="h-5 w-5" />,
                  "Pause Recording",
                  "secondary"
                )
              : renderControlButton(
                  onResumeRecording,
                  <Play className="h-5 w-5" />,
                  "Resume Recording",
                  "secondary"
                )}
            {onRestart && renderControlButton(
              onRestart,
              <RotateCcw className="h-5 w-5" />,
              "Restart Recording",
              "outline"
            )}
            {renderControlButton(
              onStopRecording,
              <StopCircle className="h-5 w-5" />,
              "Stop Recording",
              "destructive"
            )}
          </>
        )}
        
        {hasRecording && (
          <>
            {renderControlButton(
              () => onDownload('mp4'),
              <Download className="h-5 w-5" />,
              "Download MP4",
              "outline"
            )}
            {onUpload && (
              <UploadButton
                onUpload={onUpload}
                disabled={false}
                isUploading={uploadStatus === 'transcribing' || uploadStatus === 'analyzing'}
                uploadStatus={uploadStatus}
              />
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
};

export default DesktopRecordingControls;