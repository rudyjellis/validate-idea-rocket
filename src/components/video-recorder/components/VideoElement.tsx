import { forwardRef, useEffect } from "react";

interface VideoElementProps {
  isPlayingBack?: boolean;
}

const VideoElement = forwardRef<HTMLVideoElement, VideoElementProps>(({ isPlayingBack }, ref) => {
  console.log("Rendering VideoElement, isPlayingBack:", isPlayingBack);
  
  useEffect(() => {
    // Prevent video element from being recreated during recording
    const videoElement = ref as React.MutableRefObject<HTMLVideoElement>;
    if (videoElement?.current) {
      videoElement.current.style.transform = 'translateZ(0)'; // Force hardware acceleration
    }
  }, [ref]);

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={!isPlayingBack}
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
        webkit-playsinline="true"
        x-webkit-airplay="allow"
        preload="metadata"
        style={{ backfaceVisibility: 'hidden' }} // Reduce flickering
      />
    </div>
  );
});

VideoElement.displayName = "VideoElement";

export default VideoElement;