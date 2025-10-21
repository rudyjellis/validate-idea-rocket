import { useRef, useEffect, useState, useCallback } from 'react';
import { createVideoRecorderLogger } from '@/utils/logger';

const log = createVideoRecorderLogger('useAudioAnalyzer');

interface UseAudioAnalyzerOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
}

interface UseAudioAnalyzerReturn {
  frequencyData: Uint8Array;
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
}

/**
 * Hook to analyze audio from a MediaStream using Web Audio API
 * Extracts real-time frequency data for visualization
 */
export const useAudioAnalyzer = (
  stream: MediaStream | null,
  isActive: boolean,
  options: UseAudioAnalyzerOptions = {}
): UseAudioAnalyzerReturn => {
  const {
    fftSize = 256,
    smoothingTimeConstant = 0.8,
    minDecibels = -90,
    maxDecibels = -10,
  } = options;

  // Refs for Web Audio API objects
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // State
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(fftSize / 2));
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check Web Audio API support
  useEffect(() => {
    const supported = !!(window.AudioContext || (window as any).webkitAudioContext);
    setIsSupported(supported);
    
    if (!supported) {
      log.warn('Web Audio API not supported in this browser');
    } else {
      log.log('Web Audio API supported');
    }
  }, []);

  // Animation loop to extract frequency data
  const updateFrequencyData = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) {
      return;
    }

    try {
      // Get frequency data from analyser
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // Update state with new data (create new array to trigger re-render)
      setFrequencyData(new Uint8Array(dataArrayRef.current));
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(updateFrequencyData);
    } catch (err) {
      log.error('Error updating frequency data:', err);
      setError('Failed to update frequency data');
    }
  }, []);

  // Setup Web Audio API when stream is available and active
  useEffect(() => {
    // Early return if not supported, no stream, or not active
    if (!isSupported || !stream || !isActive || error) {
      return;
    }

    // Check if stream has audio tracks
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      log.warn('No audio tracks found in stream');
      setError('No audio tracks available');
      return;
    }

    log.log('Setting up Web Audio API for audio analysis');

    try {
      // Create AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      // Create AnalyserNode
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothingTimeConstant;
      analyser.minDecibels = minDecibels;
      analyser.maxDecibels = maxDecibels;
      analyserRef.current = analyser;

      // Create MediaStreamAudioSourceNode
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Connect source to analyser (but NOT to destination - we don't want to hear it)
      source.connect(analyser);

      // Create data array for frequency data
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      log.log(`Audio analyzer initialized: FFT size=${fftSize}, bins=${bufferLength}`);

      // Start animation loop
      updateFrequencyData();

      setError(null);
    } catch (err) {
      log.error('Error setting up Web Audio API:', err);
      setError('Failed to initialize audio analyzer');
    }

    // Cleanup function
    return () => {
      log.log('Cleaning up audio analyzer');

      // Cancel animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Disconnect and cleanup Web Audio API objects
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (err) {
          log.warn('Error disconnecting source:', err);
        }
        sourceRef.current = null;
      }

      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (err) {
          log.warn('Error closing audio context:', err);
        }
        audioContextRef.current = null;
      }

      analyserRef.current = null;
      dataArrayRef.current = null;

      log.log('Audio analyzer cleanup complete');
    };
  }, [
    stream,
    isActive,
    isSupported,
    fftSize,
    smoothingTimeConstant,
    minDecibels,
    maxDecibels,
    error,
    updateFrequencyData,
  ]);

  return {
    frequencyData,
    isSupported,
    isActive: isActive && isSupported && !error,
    error,
  };
};
