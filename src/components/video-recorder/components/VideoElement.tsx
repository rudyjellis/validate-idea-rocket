import { forwardRef, useEffect } from "react";

interface VideoElementProps {
  isPlayingBack?: boolean;
}

const VideoElement = forwardRef<HTMLVideoElement, VideoElementProps>(({ isPlayingBack }, ref) => {
  console.log("Rendering VideoElement, isPlayingBack:", isPlayingBack);
  
  useEffect(() => {
    const videoElement = ref as React.MutableRefObject<HTMLVideoElement>;
    if (videoElement?.current) {
      // Apply hardware acceleration and prevent layout shifts
      videoElement.current.style.transform = 'translate3d(0,0,0)';
      videoElement.current.style.backfaceVisibility = 'hidden';
      videoElement.current.style.perspective = '1000px';
    }
  }, [ref]);

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={!isPlayingBack}
        className="absolute inset-0 w-full h-full object-cover transform-gpu"
        webkit-playsinline="true"
        x-webkit-airplay="allow"
        preload="metadata"
        style={{
          WebkitTransform: 'translate3d(0,0,0)',
          WebkitBackfaceVisibility: 'hidden',
          WebkitPerspective: '1000',
          WebkitTransformStyle: 'preserve-3d'
        }}
      />
    </div>
  );
});

VideoElement.displayName = "VideoElement";

export default VideoElement;