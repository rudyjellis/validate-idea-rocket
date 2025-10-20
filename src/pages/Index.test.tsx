import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import Index from './Index';

// Mock the VideoRecorder component
vi.mock('@/components/video-recorder/VideoRecorder', () => ({
  default: () => <div data-testid="video-recorder">Video Recorder Component</div>,
}));

// Mock the useIsMobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

describe('Index Page', () => {
  it('renders the page title', () => {
    render(<Index />);
    const heading = screen.getByRole('heading', { name: /video recorder/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the VideoRecorder component', () => {
    render(<Index />);
    const videoRecorder = screen.getByTestId('video-recorder');
    expect(videoRecorder).toBeInTheDocument();
  });

  it('applies correct styling for desktop view', () => {
    const { container } = render(<Index />);
    const mainDiv = container.querySelector('.min-h-screen');
    expect(mainDiv).toHaveClass('bg-background');
  });
});
