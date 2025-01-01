import { forwardRef } from "react";

interface VideoElementProps {
  isPlayingBack?: boolean;
}

const VideoElement = forwardRef<HTMLVideoElement, VideoElementProps>(({ isPlayingBack }, ref) => (
  <video
    ref={ref}
    autoPlay
    playsInline
    muted={!isPlayingBack}
    className="absolute inset-0 w-full h-full object-cover"
    webkit-playsinline="true"
    x-webkit-airplay="allow"
    preload="metadata"
  />
));

VideoElement.displayName = "VideoElement";

export default VideoElement;