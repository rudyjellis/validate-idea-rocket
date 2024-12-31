import { Button } from "@/components/ui/button";
import { Video, StopCircle } from "lucide-react";

interface RecordingControlsProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDownload: () => void;
  hasRecording: boolean;
}

const RecordingControls = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onDownload,
  hasRecording,
}: RecordingControlsProps) => {
  return (
    <div className="flex gap-2">
      {!isRecording ? (
        <Button
          onClick={onStartRecording}
          className="gap-2"
          disabled={hasRecording}
        >
          <Video className="h-4 w-4" />
          Start Recording
        </Button>
      ) : (
        <Button onClick={onStopRecording} variant="destructive" className="gap-2">
          <StopCircle className="h-4 w-4" />
          Stop Recording
        </Button>
      )}

      {hasRecording && (
        <Button onClick={onDownload} variant="outline">
          Download Recording
        </Button>
      )}
    </div>
  );
};

export default RecordingControls;