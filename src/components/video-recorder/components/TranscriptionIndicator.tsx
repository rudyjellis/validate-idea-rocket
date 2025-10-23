import { Mic, MicOff, AlertCircle } from "lucide-react";

interface TranscriptionIndicatorProps {
  isTranscribing: boolean;
  isSupported: boolean;
  error: string | null;
  transcriptLength: number;
}

export const TranscriptionIndicator = ({
  isTranscribing,
  isSupported,
  error,
  transcriptLength,
}: TranscriptionIndicatorProps) => {
  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-md">
        <AlertCircle className="h-4 w-4" />
        <span>Live transcription not supported. Use Chrome or Edge.</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md">
        <MicOff className="h-4 w-4" />
        <span>{error}</span>
      </div>
    );
  }

  if (isTranscribing) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md">
        <Mic className="h-4 w-4 animate-pulse" />
        <span>
          Transcribing... ({transcriptLength} characters)
        </span>
      </div>
    );
  }

  return null;
};
