interface RecordButtonProps {
  onClick: () => void;
}

const RecordButton = ({ onClick }: RecordButtonProps) => {
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <div 
      role="button"
      tabIndex={0}
      aria-label="Start recording"
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 active:bg-black/40 transition-colors cursor-pointer touch-none"
      onClick={handleInteraction}
      onTouchEnd={handleInteraction}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div className="w-24 h-24 rounded-full border-4 border-white/80 flex items-center justify-center mb-4 shadow-lg pointer-events-none">
        <div className="w-20 h-20 rounded-full bg-white/80" />
      </div>
    </div>
  );
};

export default RecordButton;