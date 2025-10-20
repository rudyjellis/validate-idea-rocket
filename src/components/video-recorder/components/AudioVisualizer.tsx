import { useRef, useEffect } from 'react';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { createVideoRecorderLogger } from '@/utils/logger';

const log = createVideoRecorderLogger('AudioVisualizer');

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
  barCount?: number;
  barColor?: string;
  barGap?: number;
  position?: 'left' | 'right';
  isMobile?: boolean;
}

/**
 * Audio visualizer component that displays frequency bars
 * Uses canvas for high-performance rendering
 */
const AudioVisualizer = ({
  stream,
  isActive,
  barCount = 10,
  barColor = 'rgba(255, 255, 255, 0.7)',
  barGap = 2,
  position = 'left',
  isMobile = false,
}: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousHeightsRef = useRef<number[]>(new Array(barCount).fill(0));

  // Get frequency data from audio analyzer
  const { frequencyData, isActive: analyzerActive } = useAudioAnalyzer(stream, isActive, {
    fftSize: 256,
    smoothingTimeConstant: 0.8,
  });

  // Render bars on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyzerActive || frequencyData.length === 0) {
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      log.error('Failed to get canvas context');
      return;
    }

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Calculate bar dimensions
      const barWidth = (width - (barCount - 1) * barGap) / barCount;
      const maxBarHeight = height * 0.6; // Max 60% of canvas height

      // Sample frequency data evenly across the spectrum
      const step = Math.floor(frequencyData.length / barCount);

      for (let i = 0; i < barCount; i++) {
        // Get frequency value for this bar (average of a range)
        const startIdx = i * step;
        const endIdx = Math.min(startIdx + step, frequencyData.length);
        let sum = 0;
        for (let j = startIdx; j < endIdx; j++) {
          sum += frequencyData[j];
        }
        const avgFrequency = sum / (endIdx - startIdx);

        // Normalize to 0-1 range (frequency data is 0-255)
        const normalizedValue = avgFrequency / 255;

        // Calculate target bar height
        const targetHeight = normalizedValue * maxBarHeight;

        // Smooth transition (lerp) from previous height
        const previousHeight = previousHeightsRef.current[i];
        const smoothingFactor = 0.3; // Lower = smoother but slower
        const currentHeight = previousHeight + (targetHeight - previousHeight) * smoothingFactor;
        previousHeightsRef.current[i] = currentHeight;

        // Calculate bar position
        const x = i * (barWidth + barGap);
        const y = height - currentHeight; // Bars grow from bottom

        // Draw bar with rounded top
        ctx.fillStyle = barColor;
        ctx.beginPath();
        
        // Rounded rectangle
        const radius = Math.min(barWidth / 2, 2);
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, height);
        ctx.lineTo(x, height);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        // Add subtle glow effect
        ctx.shadowColor = barColor;
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    // Render continuously while active
    const animationId = requestAnimationFrame(function animate() {
      render();
      if (analyzerActive) {
        requestAnimationFrame(animate);
      }
    });

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [frequencyData, analyzerActive, barCount, barColor, barGap]);

  // Don't render if not active
  if (!analyzerActive) {
    return null;
  }

  // Responsive sizing
  const canvasWidth = isMobile ? 32 : 40;
  const canvasHeight = isMobile ? 120 : 160;

  // Position classes
  const positionClass = position === 'left' ? 'left-4' : 'right-4';

  return (
    <div 
      className={`absolute ${positionClass} top-1/2 -translate-y-1/2 z-10`}
      style={{
        pointerEvents: 'none', // Don't block clicks
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="transform-gpu"
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
        }}
      />
    </div>
  );
};

export default AudioVisualizer;
