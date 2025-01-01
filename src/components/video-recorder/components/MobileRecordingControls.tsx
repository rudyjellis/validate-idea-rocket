import { Button } from "@/components/ui/button";
import { StopCircle } from "lucide-react";
import type { RecordingState } from "../types";

interface MobileRecordingControlsProps {
  recordingState: RecordingState;
  onTapToPause?: () => void;
  onTapToStop?: () => void;
}

const MobileRecordingControls = ({
  recordingState,
  onTapToPause,
  onTapToStop,
}: MobileRecordingControlsProps) => {
  if (recordingState !== "recording") return null;

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
      {onTapToPause && (
        <Button
          onClick={onTapToPause}
          variant="secondary"
          size="lg"
          className="rounded-full shadow-lg"
        >
          Pause
        </Button>
      )}
      {onTapToStop && (
        <Button
          onClick={onTapToStop}
          variant="destructive"
          size="icon"
          className="rounded-full w-12 h-12 shadow-lg"
        >
          <StopCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default MobileRecordingControls;