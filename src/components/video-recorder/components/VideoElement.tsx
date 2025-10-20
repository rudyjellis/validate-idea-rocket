import { forwardRef, useEffect, useImperativeHandle } from "react";
import { createVideoRecorderLogger } from "@/utils/logger";

const log = createVideoRecorderLogger('VideoElement');

interface VideoElementProps {
  isPlayingBack?: boolean;
  currentMode?: 'stream' | 'playback' | 'idle';
}

export interface VideoElementRef {
  play: () => Promise<void>;
  pause: () => void;
  reset: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

const VideoElement = forwardRef<VideoElementRef, VideoElementProps>(({ isPlayingBack, currentMode = 'idle' }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Expose video control methods through ref
  useImperativeHandle(ref, () => ({
    play: async () => {
      if (videoRef.current) {
        try {
          await videoRef.current.play();
          log.log("Video playback started");
        } catch (error) {
          log.error("Error starting video playback:", error);
          throw error;
        }
      }
    },
    pause: () => {
      if (videoRef.current) {
        videoRef.current.pause();
        log.log("Video playback paused");
      }
    },
    reset: () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        log.log("Video playback reset");
      }
    },
    getCurrentTime: () => videoRef.current?.currentTime || 0,
    getDuration: () => videoRef.current?.duration || 0,
  }), []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      // Apply hardware acceleration and prevent layout shifts
      videoElement.style.transform = 'translate3d(0,0,0)';
      videoElement.style.backfaceVisibility = 'hidden';
      videoElement.style.perspective = '1000px';
      
      // Apply webkit optimizations
      videoElement.style.WebkitTransform = 'translate3d(0,0,0)';
      videoElement.style.WebkitBackfaceVisibility = 'hidden';
      videoElement.style.WebkitPerspective = '1000';
      videoElement.style.WebkitTransformStyle = 'preserve-3d';
    }
  }, []);

  // Handle mode-specific attributes
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    switch (currentMode) {
      case 'stream':
        videoElement.muted = true;
        videoElement.autoplay = true;
        break;
      case 'playback':
        videoElement.muted = !isPlayingBack;
        videoElement.autoplay = false;
        break;
      case 'idle':
        videoElement.pause();
        videoElement.currentTime = 0;
        break;
    }
  }, [currentMode, isPlayingBack]);

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        playsInline
        webkit-playsinline="true"
        x-webkit-airplay="allow"
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover transform-gpu"
      />
    </div>
  );
});

VideoElement.displayName = "VideoElement";

export default VideoElement;