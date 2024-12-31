import { Pause, StopCircle } from "lucide-react";

interface RecordingControlsProps {
  onTapToPause?: () => void;
  onTapToStop?: () => void;
}

const RecordingControls = ({ onTapToPause, onTapToStop }: RecordingControlsProps) => (
  <>
    <button
      onClick={onTapToPause}
      className="absolute bottom-8 left-8 bg-black/75 p-4 rounded-full text-white hover:bg-black/90 transition-colors z-20 shadow-lg active:scale-95 transform"
    >
      <Pause className="w-8 h-8" />
    </button>
    <button
      onClick={onTapToStop}
      className="absolute bottom-8 right-8 bg-black/75 p-4 rounded-full text-white hover:bg-black/90 transition-colors z-20 shadow-lg active:scale-95 transform"
    >
      <StopCircle className="w-8 h-8" />
    </button>
  </>
);

export default RecordingControls;