import { forwardRef } from "react";

interface VideoElementProps {
  isPlayingBack?: boolean;
}

const VideoElement = forwardRef<HTMLVideoElement, VideoElementProps>(({ isPlayingBack }, ref) => {
  console.log("Rendering VideoElement, isPlayingBack:", isPlayingBack);
  
  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={ref}
        autoPlay
        playsInline
        controls={false}
        muted={!isPlayingBack}
        className="absolute inset-0 w-full h-full object-cover"
        webkit-playsinline="true"
        x-webkit-airplay="allow"
        preload="metadata"
      />
    </div>
  );
});

VideoElement.displayName = "VideoElement";

export default VideoElement;