import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { createVideoRecorderLogger } from "@/utils/logger";

const log = createVideoRecorderLogger('VideoElement');

interface VideoElementProps {
  isPlayingBack?: boolean;
  currentMode?: 'stream' | 'playback' | 'idle';
  stream?: MediaStream | null;
  recordedBlob?: Blob | null;
}

export interface VideoElementRef {
  play: () => Promise<void>;
  pause: () => void;
  reset: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getVideoElement: () => HTMLVideoElement | null;
  setVideoSource: (blob: Blob) => void;
}

const VideoElement = forwardRef<VideoElementRef, VideoElementProps>(({ isPlayingBack, currentMode = 'idle', stream, recordedBlob }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const blobUrlRef = useRef<string | null>(null);

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
    getVideoElement: () => videoRef.current,
    setVideoSource: (blob: Blob) => {
      if (videoRef.current) {
        // Revoke previous blob URL if exists
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        
        // Create new blob URL
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        
        // Set as video source
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
        videoRef.current.muted = false;
        log.log("Video source set to recorded blob");
      }
    },
  }), []);

  // Attach stream to video element when stream changes
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (stream) {
      log.log("Attaching stream to video element");
      videoElement.srcObject = stream;
      videoElement.muted = true;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      
      // Try to play the stream
      videoElement.play().catch(error => {
        log.error("Error auto-playing stream:", error);
      });
    } else if (!stream) {
      log.log("Clearing video element stream");
      videoElement.srcObject = null;
    }
  }, [stream]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      // Apply hardware acceleration and prevent layout shifts
      videoElement.style.transform = 'translate3d(0,0,0)';
      videoElement.style.backfaceVisibility = 'hidden';
      videoElement.style.perspective = '1000px';
      
      // Apply webkit optimizations
      videoElement.style.webkitTransform = 'translate3d(0,0,0)';
      videoElement.style.webkitBackfaceVisibility = 'hidden';
      videoElement.style.webkitPerspective = '1000';
      videoElement.style.webkitTransformStyle = 'preserve-3d';
    }
  }, []);

  // Handle playback mode with recorded blob
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlayingBack && recordedBlob) {
      log.log("Setting up playback with recorded blob");
      
      // Revoke previous blob URL if exists
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      
      // Create new blob URL
      const url = URL.createObjectURL(recordedBlob);
      blobUrlRef.current = url;
      
      // Set as video source for playback
      videoElement.srcObject = null;
      videoElement.src = url;
      videoElement.muted = false;
      videoElement.load();
    } else if (!isPlayingBack && stream) {
      // Back to stream mode
      log.log("Switching back to stream mode");
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      videoElement.src = '';
    }
  }, [isPlayingBack, recordedBlob, stream]);

  // Simplified mode handling - let the stream handle most of this
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (currentMode === 'idle' && !isPlayingBack) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
  }, [currentMode, isPlayingBack]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

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