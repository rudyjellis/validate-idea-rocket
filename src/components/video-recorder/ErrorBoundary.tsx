/* eslint-disable react-refresh/only-export-components */
// This file intentionally exports both the ErrorBoundary component and useErrorHandler hook
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class VideoRecorderErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('VideoRecorder Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-red-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">⚠️</div>
              <h2 className="text-xl font-semibold text-red-600">Video Recorder Error</h2>
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-700">
                Something went wrong with the video recorder. This might be due to:
              </p>
              <ul className="text-sm space-y-1 ml-4 text-gray-600">
                <li>• Camera permission denied</li>
                <li>• Browser compatibility issues</li>
                <li>• Hardware acceleration problems</li>
                <li>• Network connectivity issues</li>
              </ul>
              
              {this.state.error && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    Technical Details
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded border overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={this.handleRetry}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  🔄 Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = () => setError(null);

  const handleError = (error: Error) => {
    console.error('VideoRecorder Error:', error);
    setError(error);
  };

  return {
    error,
    resetError,
    handleError,
  };
};

export default VideoRecorderErrorBoundary;
