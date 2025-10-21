import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import VideoElement, { VideoElementRef } from './VideoElement';

// Mock logger
vi.mock('@/utils/logger', () => ({
  createVideoRecorderLogger: () => ({
    log: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('VideoElement Component', () => {
  let mockStream: MediaStream;
  let mockBlob: Blob;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock MediaStream
    mockStream = {
      getTracks: vi.fn(() => []),
      getVideoTracks: vi.fn(() => []),
      getAudioTracks: vi.fn(() => []),
    } as unknown as MediaStream;

    // Mock Blob
    mockBlob = new Blob(['test video data'], { type: 'video/webm' });

    // Mock URL.createObjectURL and URL.revokeObjectURL
    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = vi.fn();
    }
    if (!global.URL.revokeObjectURL) {
      global.URL.revokeObjectURL = vi.fn();
    }
    
    createObjectURLSpy = vi.spyOn(global.URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(global.URL, 'revokeObjectURL').mockImplementation(() => {});

    // Mock HTMLVideoElement methods
    HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLVideoElement.prototype.pause = vi.fn();
    HTMLVideoElement.prototype.load = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (createObjectURLSpy?.mockRestore) {
      createObjectURLSpy.mockRestore();
    }
    if (revokeObjectURLSpy?.mockRestore) {
      revokeObjectURLSpy.mockRestore();
    }
  });

  describe('Stream Mode (Recording Preview)', () => {
    it('should render video element with stream', () => {
      const { container } = render(
        <VideoElement stream={mockStream} currentMode="stream" />
      );
      
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
    });

    it('should set srcObject when stream is provided', () => {
      const { container } = render(
        <VideoElement stream={mockStream} currentMode="stream" />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video.srcObject).toBe(mockStream);
    });

    it('should mute video during stream mode', () => {
      const { container } = render(
        <VideoElement stream={mockStream} currentMode="stream" />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video.muted).toBe(true);
    });

    it('should set autoplay and playsInline for stream', () => {
      const { container } = render(
        <VideoElement stream={mockStream} currentMode="stream" />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video.autoplay).toBe(true);
      expect(video.playsInline).toBe(true);
    });

    it('should NOT have black screen - stream should be visible', () => {
      const { container } = render(
        <VideoElement stream={mockStream} currentMode="stream" />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      
      // Video should have srcObject set (not black)
      expect(video.srcObject).toBe(mockStream);
      
      // Video should not have blob src (which would override srcObject)
      expect(video.src).not.toContain('blob:');
    });

    it('should apply hardware acceleration styles', () => {
      const { container } = render(
        <VideoElement stream={mockStream} currentMode="stream" />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video.style.transform).toBe('translate3d(0,0,0)');
      expect(video.style.backfaceVisibility).toBe('hidden');
    });
  });

  describe('Playback Mode (Recorded Video)', () => {
    it('should set video src from blob URL when playing back', () => {
      const { container } = render(
        <VideoElement 
          isPlayingBack={true}
          recordedBlob={mockBlob}
          currentMode="playback"
        />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      
      // Should create blob URL
      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      
      // Should set src to blob URL
      expect(video.src).toContain('blob:mock-url');
    });

    it('should NOT have black screen - recorded video should be visible', () => {
      const { container } = render(
        <VideoElement 
          isPlayingBack={true}
          recordedBlob={mockBlob}
          currentMode="playback"
        />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      
      // Video should have src set to blob URL (not black)
      expect(video.src).toContain('blob:mock-url');
      
      // Video should NOT have srcObject (stream mode)
      expect(video.srcObject).toBeNull();
    });

    it('should unmute video during playback', () => {
      const { container, rerender } = render(
        <VideoElement stream={mockStream} currentMode="stream" />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video.muted).toBe(true);
      
      // Switch to playback mode
      rerender(
        <VideoElement 
          isPlayingBack={true}
          recordedBlob={mockBlob}
          currentMode="playback"
        />
      );
      
      expect(video.muted).toBe(false);
    });

    it('should call load() when setting blob source', () => {
      const { container } = render(
        <VideoElement 
          isPlayingBack={true}
          recordedBlob={mockBlob}
          currentMode="playback"
        />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video.load).toHaveBeenCalled();
    });

    it('should clear srcObject when switching to playback', () => {
      const { container, rerender } = render(
        <VideoElement stream={mockStream} currentMode="stream" />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video.srcObject).toBe(mockStream);
      
      // Switch to playback
      rerender(
        <VideoElement 
          isPlayingBack={true}
          recordedBlob={mockBlob}
          currentMode="playback"
        />
      );
      
      expect(video.srcObject).toBeNull();
    });
  });

  describe('Mode Switching', () => {
    it('should switch from stream to playback without black screen', () => {
      const { container, rerender } = render(
        <VideoElement stream={mockStream} currentMode="stream" />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      
      // Initially in stream mode
      expect(video.srcObject).toBe(mockStream);
      expect(video.src).not.toContain('blob:');
      
      // Switch to playback mode
      rerender(
        <VideoElement 
          isPlayingBack={true}
          recordedBlob={mockBlob}
          currentMode="playback"
        />
      );
      
      // Should now have blob URL
      expect(video.src).toContain('blob:mock-url');
      expect(video.srcObject).toBeNull();
    });

    it('should switch from playback back to stream', () => {
      const { container, rerender } = render(
        <VideoElement 
          isPlayingBack={true}
          recordedBlob={mockBlob}
          currentMode="playback"
        />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video.src).toContain('blob:mock-url');
      
      // Switch back to stream
      rerender(
        <VideoElement 
          isPlayingBack={false}
          stream={mockStream}
          currentMode="stream"
        />
      );
      
      expect(video.src).not.toContain('blob:');
      expect(video.srcObject).toBe(mockStream);
    });

    it('should revoke old blob URL when switching modes', () => {
      const { rerender } = render(
        <VideoElement 
          isPlayingBack={true}
          recordedBlob={mockBlob}
          currentMode="playback"
        />
      );
      
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
      
      // Switch to stream mode
      rerender(
        <VideoElement 
          isPlayingBack={false}
          stream={mockStream}
          currentMode="stream"
        />
      );
      
      // Should revoke the blob URL
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('Ref Methods', () => {
    it('should expose play method through ref', async () => {
      const ref = createRef<VideoElementRef>();
      render(<VideoElement ref={ref} stream={mockStream} />);
      
      expect(ref.current).toBeTruthy();
      await ref.current?.play();
      
      expect(HTMLVideoElement.prototype.play).toHaveBeenCalled();
    });

    it('should expose pause method through ref', () => {
      const ref = createRef<VideoElementRef>();
      render(<VideoElement ref={ref} stream={mockStream} />);
      
      ref.current?.pause();
      expect(HTMLVideoElement.prototype.pause).toHaveBeenCalled();
    });

    it('should expose setVideoSource method through ref', () => {
      const ref = createRef<VideoElementRef>();
      const { container } = render(<VideoElement ref={ref} stream={mockStream} />);
      
      const video = container.querySelector('video') as HTMLVideoElement;
      
      // Call setVideoSource
      ref.current?.setVideoSource(mockBlob);
      
      // Should create blob URL and set as src
      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      expect(video.src).toContain('blob:mock-url');
      expect(video.srcObject).toBeNull();
      expect(video.muted).toBe(false);
    });

    it('should expose getCurrentTime method', () => {
      const ref = createRef<VideoElementRef>();
      render(<VideoElement ref={ref} stream={mockStream} />);
      
      const time = ref.current?.getCurrentTime();
      expect(typeof time).toBe('number');
    });

    it('should expose getDuration method', () => {
      const ref = createRef<VideoElementRef>();
      render(<VideoElement ref={ref} stream={mockStream} />);
      
      const duration = ref.current?.getDuration();
      expect(typeof duration).toBe('number');
    });

    it('should expose getVideoElement method', () => {
      const ref = createRef<VideoElementRef>();
      const { container } = render(<VideoElement ref={ref} stream={mockStream} />);
      
      const video = container.querySelector('video');
      const refVideo = ref.current?.getVideoElement();
      
      expect(refVideo).toBe(video);
    });
  });

  describe('Memory Management', () => {
    it('should cleanup blob URL on unmount', () => {
      const { unmount } = render(
        <VideoElement 
          isPlayingBack={true}
          recordedBlob={mockBlob}
          currentMode="playback"
        />
      );
      
      expect(createObjectURLSpy).toHaveBeenCalled();
      
      unmount();
      
      // Should revoke blob URL on cleanup
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should revoke old blob URL when new blob is provided', () => {
      const { rerender } = render(
        <VideoElement 
          isPlayingBack={true}
          recordedBlob={mockBlob}
          currentMode="playback"
        />
      );
      
      const firstBlobUrl = 'blob:mock-url';
      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      
      // Create new blob
      const newBlob = new Blob(['new video data'], { type: 'video/webm' });
      createObjectURLSpy.mockReturnValue('blob:new-mock-url');
      
      // Update with new blob
      rerender(
        <VideoElement 
          isPlayingBack={true}
          recordedBlob={newBlob}
          currentMode="playback"
        />
      );
      
      // Should revoke old URL
      expect(revokeObjectURLSpy).toHaveBeenCalledWith(firstBlobUrl);
      
      // Should create new URL
      expect(createObjectURLSpy).toHaveBeenCalledWith(newBlob);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null stream gracefully', () => {
      const { container } = render(
        <VideoElement stream={null} currentMode="stream" />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video).toBeInTheDocument();
      expect(video.srcObject).toBeNull();
    });

    it('should handle null blob gracefully', () => {
      const { container } = render(
        <VideoElement 
          isPlayingBack={true}
          recordedBlob={null}
          currentMode="playback"
        />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video).toBeInTheDocument();
      // Should not create blob URL
      expect(createObjectURLSpy).not.toHaveBeenCalled();
    });

    it('should handle idle mode', () => {
      const { container } = render(
        <VideoElement currentMode="idle" />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video).toBeInTheDocument();
      expect(HTMLVideoElement.prototype.pause).toHaveBeenCalled();
    });
  });

  describe('Visual Regression Prevention', () => {
    it('should NEVER show black screen during recording', () => {
      const { container } = render(
        <VideoElement stream={mockStream} currentMode="stream" />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      
      // Critical checks to prevent black screen
      expect(video.srcObject).toBe(mockStream); // Stream must be set
      expect(video.src).not.toContain('blob:'); // No blob src that would override
      expect(video.autoplay).toBe(true); // Must autoplay
      expect(video.playsInline).toBe(true); // Must play inline
    });

    it('should NEVER show black screen during playback', () => {
      const { container } = render(
        <VideoElement 
          isPlayingBack={true}
          recordedBlob={mockBlob}
          currentMode="playback"
        />
      );
      
      const video = container.querySelector('video') as HTMLVideoElement;
      
      // Critical checks to prevent black screen
      expect(video.src).toContain('blob:'); // Blob URL must be set
      expect(video.srcObject).toBeNull(); // No stream that would conflict
      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob); // Blob URL created
      expect(video.load).toHaveBeenCalled(); // Video loaded
    });
  });
});
