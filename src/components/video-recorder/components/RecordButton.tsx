interface RecordButtonProps {
  onClick: () => void;
}

const RecordButton = ({ onClick }: RecordButtonProps) => (
  <div 
    className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 active:bg-black/40 transition-colors cursor-pointer"
    onClick={onClick}
  >
    <div className="w-24 h-24 rounded-full border-4 border-white/80 flex items-center justify-center mb-4 shadow-lg">
      <div className="w-20 h-20 rounded-full bg-white/80" />
    </div>
  </div>
);

export default RecordButton;