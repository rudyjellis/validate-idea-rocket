import { Button } from "@/components/ui/button";
import { Video, StopCircle, Pause, Play, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { RecordingState } from "../types";

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
  hasRecording: boolean;
  isPlayingBack?: boolean;
}

const DesktopRecordingControls = ({
  recordingState,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onDownload,
  onPlayback,
  onStopPlayback,
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
            {renderControlButton(
              onStopRecording,
              <StopCircle className="h-5 w-5" />,
              "Stop Recording",
              "destructive"
            )}
          </>
        )}
        
        {hasRecording && !isPlayingBack && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shadow-sm">
                    <Download className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download Recording</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onDownload('webm')}>
                Download as WebM
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload('mp4')}>
                Download as MP4
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </TooltipProvider>
  );
};

export default DesktopRecordingControls;