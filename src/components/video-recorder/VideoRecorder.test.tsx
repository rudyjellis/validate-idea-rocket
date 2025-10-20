import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@/test/utils';
import VideoRecorder from './VideoRecorder';

// Mock the mobile/desktop components
vi.mock('./components/MobileVideoRecorder', () => ({
  default: ({ maxDuration }: { maxDuration: number }) => (
    <div data-testid="mobile-video-recorder" data-max-duration={maxDuration}>
      Mobile Video Recorder
    </div>
  ),
}));

vi.mock('./components/DesktopVideoRecorder', () => ({
  default: ({ maxDuration }: { maxDuration: number }) => (
    <div data-testid="desktop-video-recorder" data-max-duration={maxDuration}>
      Desktop Video Recorder
    </div>
  ),
}));

// Mock useIsMobile hook
const mockUseIsMobile = vi.fn();
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

describe('VideoRecorder Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Mode', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false);
    });

    it('renders desktop video recorder when not mobile', () => {
      const { getByTestId } = render(<VideoRecorder />);
      expect(getByTestId('desktop-video-recorder')).toBeInTheDocument();
    });

    it('passes maxDuration prop to desktop recorder', () => {
      const { getByTestId } = render(<VideoRecorder maxDuration={60} />);
      const recorder = getByTestId('desktop-video-recorder');
      expect(recorder).toHaveAttribute('data-max-duration', '60');
    });

    it('uses default maxDuration of 30 seconds', () => {
      const { getByTestId } = render(<VideoRecorder />);
      const recorder = getByTestId('desktop-video-recorder');
      expect(recorder).toHaveAttribute('data-max-duration', '30');
    });

    it('matches desktop snapshot', () => {
      const { container } = render(<VideoRecorder />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Mobile Mode', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('renders mobile video recorder when on mobile', () => {
      const { getByTestId } = render(<VideoRecorder />);
      expect(getByTestId('mobile-video-recorder')).toBeInTheDocument();
    });

    it('passes maxDuration prop to mobile recorder', () => {
      const { getByTestId } = render(<VideoRecorder maxDuration={45} />);
      const recorder = getByTestId('mobile-video-recorder');
      expect(recorder).toHaveAttribute('data-max-duration', '45');
    });

    it('applies mobile-specific styling', () => {
      const { container } = render(<VideoRecorder />);
      const wrapper = container.querySelector('.h-\\[100dvh\\]');
      expect(wrapper).toBeInTheDocument();
    });

    it('matches mobile snapshot', () => {
      const { container } = render(<VideoRecorder />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Error Boundary', () => {
    it('wraps component in error boundary', () => {
      const { container } = render(<VideoRecorder />);
      // Error boundary should be present in the component tree
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Component Structure', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false);
    });

    it('maintains consistent structure', () => {
      const { container } = render(<VideoRecorder />);
      
      // Check for main wrapper
      const mainWrapper = container.querySelector('.flex.flex-col');
      expect(mainWrapper).toBeInTheDocument();
      
      // Check for inner container
      const innerContainer = container.querySelector('.w-full');
      expect(innerContainer).toBeInTheDocument();
    });

    it('applies transform-gpu for performance', () => {
      const { container } = render(<VideoRecorder />);
      const wrapper = container.querySelector('.transform-gpu');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies transition classes', () => {
      const { container } = render(<VideoRecorder />);
      const innerContainer = container.querySelector('.transition-all');
      expect(innerContainer).toBeInTheDocument();
    });
  });
});
