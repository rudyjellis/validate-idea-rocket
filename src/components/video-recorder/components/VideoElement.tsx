import { forwardRef } from "react";

interface VideoElementProps {
  isPlayingBack?: boolean;
}

const VideoElement = forwardRef<HTMLVideoElement, VideoElementProps>(({ isPlayingBack }, ref) => {
  console.log("Rendering VideoElement, isPlayingBack:", isPlayingBack);
  
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      controls={false}
      muted={!isPlayingBack}
      className="absolute inset-0 w-full h-full object-cover bg-black"
      webkit-playsinline="true"
      x-webkit-airplay="allow"
      preload="metadata"
    />
  );
});

VideoElement.displayName = "VideoElement";

export default VideoElement;