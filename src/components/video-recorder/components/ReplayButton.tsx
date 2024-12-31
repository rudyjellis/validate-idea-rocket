import { RefreshCw } from "lucide-react";

interface ReplayButtonProps {
  onClick: () => void;
}

const ReplayButton = ({ onClick }: ReplayButtonProps) => (
  <button
    onClick={onClick}
    className="absolute bottom-4 right-4 bg-black/75 p-2 rounded-full text-white hover:bg-black/90 transition-colors z-20"
    aria-label="Replay recording"
  >
    <RefreshCw className="w-6 h-6" />
  </button>
);

export default ReplayButton;