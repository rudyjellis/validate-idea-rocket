import { formatTime } from "../utils/timeUtils";

interface PlaybackOverlayProps {
  currentTime: number;
}

const PlaybackOverlay = ({ currentTime }: PlaybackOverlayProps) => (
  <>
    <div className="absolute top-6 left-6 bg-black/75 text-white px-4 py-2 rounded-full text-base font-medium shadow-lg">
      Playing Recording
    </div>
    <div className="absolute bottom-6 left-6 bg-black/75 text-white px-4 py-2 rounded-full text-base font-medium shadow-lg">
      {formatTime(currentTime)}
    </div>
  </>
);

export default PlaybackOverlay;