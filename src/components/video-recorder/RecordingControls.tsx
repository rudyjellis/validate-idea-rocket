import { Button } from "@/components/ui/button";
import { Video, StopCircle, Pause, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RecordingState } from "./types";

interface RecordingControlsProps {
  recordingState: RecordingState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onDownload: (format: 'webm' | 'mp4') => void;
  onPlayback: () => void;
  hasRecording: boolean;
}

const RecordingControls = ({
  recordingState,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onDownload,
  onPlayback,
  hasRecording,
}: RecordingControlsProps) => {
  return (
    <div className="flex gap-2 mt-4 justify-center w-full bg-transparent">
      {recordingState === "idle" ? (
        <>
          <Button
            onClick={onStartRecording}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            disabled={hasRecording}
            size="lg"
          >
            <Video className="h-4 w-4" />
            Start Recording
          </Button>
          {hasRecording && (
            <Button
              onClick={onPlayback}
              variant="secondary"
              size="lg"
              className="gap-2 shadow-sm"
            >
              <Play className="h-4 w-4" />
              Play Recording
            </Button>
          )}
        </>
      ) : (
        <>
          {recordingState === "recording" ? (
            <Button
              onClick={onPauseRecording}
              variant="secondary"
              className="gap-2 shadow-sm"
              size="lg"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          ) : (
            <Button
              onClick={onResumeRecording}
              variant="secondary"
              className="gap-2 shadow-sm"
              size="lg"
            >
              <Play className="h-4 w-4" />
              Resume
            </Button>
          )}
          <Button
            onClick={onStopRecording}
            variant="destructive"
            className="gap-2 shadow-sm"
            size="lg"
          >
            <StopCircle className="h-4 w-4" />
            Stop Recording
          </Button>
        </>
      )}
      
      {hasRecording && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="lg" className="shadow-sm">
              Download Recording
            </Button>
          </DropdownMenuTrigger>
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
  );
};

export default RecordingControls;