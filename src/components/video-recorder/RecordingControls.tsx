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
    <div className="flex gap-2 mt-4 justify-center w-full bg-transparent">
      {!isRecording ? (
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
        <Button
          onClick={onStopRecording}
          variant="destructive"
          className="gap-2 shadow-sm"
          size="lg"
        >
          <StopCircle className="h-4 w-4" />
          Stop Recording
        </Button>
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