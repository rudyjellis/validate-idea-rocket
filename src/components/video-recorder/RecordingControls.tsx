import { Button } from "@/components/ui/button";
import { Video, StopCircle, Pause, Play, Download } from "lucide-react";
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
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            disabled={hasRecording}
            size="icon"
            title="Start Recording"
          >
            <Video className="h-5 w-5" />
          </Button>
          {hasRecording && (
            <Button
              onClick={onPlayback}
              variant="secondary"
              size="icon"
              className="shadow-sm"
              title="Play Recording"
            >
              <Play className="h-5 w-5" />
            </Button>
          )}
        </>
      ) : (
        <>
          {recordingState === "recording" ? (
            <Button
              onClick={onPauseRecording}
              variant="secondary"
              className="shadow-sm"
              size="icon"
              title="Pause Recording"
            >
              <Pause className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={onResumeRecording}
              variant="secondary"
              className="shadow-sm"
              size="icon"
              title="Resume Recording"
            >
              <Play className="h-5 w-5" />
            </Button>
          )}
          <Button
            onClick={onStopRecording}
            variant="destructive"
            className="shadow-sm"
            size="icon"
            title="Stop Recording"
          >
            <StopCircle className="h-5 w-5" />
          </Button>
        </>
      )}
      
      {hasRecording && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="shadow-sm" title="Download Recording">
              <Download className="h-5 w-5" />
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