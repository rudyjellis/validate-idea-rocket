interface LoadingOverlayProps {
  isInitializing: boolean;
}

const LoadingOverlay = ({ isInitializing }: LoadingOverlayProps) => {
  if (!isInitializing) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
      <div className="text-white">Initializing camera...</div>
    </div>
  );
};

export default LoadingOverlay;