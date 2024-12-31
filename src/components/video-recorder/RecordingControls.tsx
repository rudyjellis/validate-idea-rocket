import { Button } from "@/components/ui/button";
import { Video, StopCircle, Pause, Play } from "lucide-react";
import type { RecordingState } from "./types";

interface RecordingControlsProps {
  recordingState: RecordingState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onDownload: () => void;
  hasRecording: boolean;
}

const RecordingControls = ({
  recordingState,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onDownload,
  hasRecording,
}: RecordingControlsProps) => {
  return (
    <div className="flex gap-2 mt-4 justify-center w-full bg-transparent">
      {recordingState === "idle" ? (
        <Button
          onClick={onStartRecording}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          disabled={hasRecording}
          size="lg"
        >
          <Video className="h-4 w-4" />
          Start Recording
        </Button>
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
        <Button onClick={onDownload} variant="outline" size="lg" className="shadow-sm">
          Download Recording
        </Button>
      )}
    </div>
  );
};

export default RecordingControls;