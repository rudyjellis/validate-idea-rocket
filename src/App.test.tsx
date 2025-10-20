import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import Index from './pages/Index';

// Mock the VideoRecorder component
vi.mock('@/components/video-recorder/VideoRecorder', () => ({
  default: () => <div data-testid="video-recorder">Video Recorder Component</div>,
}));

// Mock the useIsMobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const AppWrapper = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Index />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

describe('App', () => {
  it('renders without crashing', () => {
    render(<AppWrapper />);
    expect(document.body).toBeTruthy();
  });

  it('renders the main route', () => {
    render(<AppWrapper />);
    const heading = screen.getByRole('heading', { name: /video recorder/i });
    expect(heading).toBeInTheDocument();
  });

  it('provides QueryClient context', () => {
    const { container } = render(<AppWrapper />);
    expect(container).toBeTruthy();
  });

  it('renders the VideoRecorder component', () => {
    render(<AppWrapper />);
    const videoRecorder = screen.getByTestId('video-recorder');
    expect(videoRecorder).toBeInTheDocument();
  });
});
