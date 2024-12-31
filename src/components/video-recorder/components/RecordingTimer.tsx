import { formatTime } from "../utils/timeUtils";

interface RecordingTimerProps {
  timeLeft: number;
}

const RecordingTimer = ({ timeLeft }: RecordingTimerProps) => (
  <div className="absolute top-6 right-6 bg-black/75 text-white px-4 py-2 rounded-full text-base font-medium shadow-lg">
    {timeLeft}s
  </div>
);

export default RecordingTimer;