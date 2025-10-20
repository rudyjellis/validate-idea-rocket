import { Button } from "@/components/ui/button";
import { StopCircle, Download } from "lucide-react";
import type { RecordingState } from "../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileRecordingControlsProps {
  recordingState: RecordingState;
  onTapToPause?: () => void;
  onTapToStop?: () => void;
  onDownload?: (format: 'webm' | 'mp4') => void;
  hasRecording?: boolean;
}

const MobileRecordingControls = ({
  recordingState,
  onTapToPause,
  onTapToStop,
  onDownload,
  hasRecording = false,
}: MobileRecordingControlsProps) => {
  // Show controls during recording
  if (recordingState === "recording") {
    return (
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
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
  }

  // Show download button after recording (when idle with recording available)
  if (recordingState === "idle" && hasRecording && onDownload) {
    return (
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full shadow-lg bg-white"
            >
              <Download className="h-5 w-5 mr-2" />
              Download
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
      </div>
    );
  }

  return null;
};

export default MobileRecordingControls;