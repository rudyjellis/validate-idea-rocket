import { forwardRef } from "react";

const VideoElement = forwardRef<HTMLVideoElement>((_, ref) => (
  <video
    ref={ref}
    autoPlay
    playsInline
    muted
    className="absolute inset-0 w-full h-full object-cover"
    webkit-playsinline="true"
    x-webkit-airplay="allow"
    preload="metadata"
  />
));

VideoElement.displayName = "VideoElement";

export default VideoElement;