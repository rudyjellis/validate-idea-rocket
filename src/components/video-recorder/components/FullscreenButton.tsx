import { Maximize2 } from "lucide-react";

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onClick: () => void;
}

const FullscreenButton = ({ isFullscreen, onClick }: FullscreenButtonProps) => (
  <button
    onClick={onClick}
    className="absolute top-4 right-4 bg-black/75 p-2 rounded-full text-white hover:bg-black/90 transition-colors z-20"
    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
  >
    <Maximize2 className="w-6 h-6" />
  </button>
);

export default FullscreenButton;