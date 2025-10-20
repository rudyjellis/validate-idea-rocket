import { useEffect } from 'react';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';

interface AudioAnalyzerTestProps {
  stream: MediaStream | null;
  isActive: boolean;
}

/**
 * Test component to verify useAudioAnalyzer hook
 * Logs frequency data to console for verification
 */
const AudioAnalyzerTest = ({ stream, isActive }: AudioAnalyzerTestProps) => {
  const { frequencyData, isSupported, isActive: analyzerActive, error } = useAudioAnalyzer(
    stream,
    isActive,
    {
      fftSize: 256,
      smoothingTimeConstant: 0.8,
    }
  );

  // Log status on mount
  useEffect(() => {
    console.log('AudioAnalyzerTest mounted');
    console.log('Web Audio API supported:', isSupported);
  }, [isSupported]);

  // Log frequency data periodically (every 2 seconds)
  useEffect(() => {
    if (!analyzerActive || frequencyData.length === 0) return;

    const interval = setInterval(() => {
      // Calculate average frequency
      const sum = frequencyData.reduce((acc, val) => acc + val, 0);
      const avg = sum / frequencyData.length;
      
      // Find peak frequency
      const max = Math.max(...Array.from(frequencyData));
      
      console.log('Audio Analysis:', {
        bins: frequencyData.length,
        average: avg.toFixed(2),
        peak: max,
        sample: Array.from(frequencyData.slice(0, 8)), // First 8 bins
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [analyzerActive, frequencyData]);

  // Log errors
  useEffect(() => {
    if (error) {
      console.error('Audio Analyzer Error:', error);
    }
  }, [error]);

  // Render status indicator
  return (
    <div className="absolute top-20 left-4 bg-black/75 text-white px-3 py-2 rounded text-xs z-50">
      <div>Audio Analyzer: {analyzerActive ? '🟢 Active' : '⚪ Inactive'}</div>
      {!isSupported && <div className="text-red-400">⚠️ Not Supported</div>}
      {error && <div className="text-red-400">❌ {error}</div>}
      {analyzerActive && (
        <div className="text-green-400">
          {frequencyData.length} bins
        </div>
      )}
    </div>
  );
};

export default AudioAnalyzerTest;
