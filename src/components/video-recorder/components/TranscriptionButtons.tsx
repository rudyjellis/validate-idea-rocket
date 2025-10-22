import { Button } from "@/components/ui/button";
import { Loader2, Mic, Zap, Globe } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UploadStatus } from "@/hooks/useVideoUpload";
import type { TranscriptionProviderType } from "@/services/transcription";

interface TranscriptionButtonsProps {
  onTranscribe: (provider: TranscriptionProviderType) => void;
  disabled?: boolean;
  uploadStatus: UploadStatus;
  selectedProvider?: TranscriptionProviderType | null;
}

export function TranscriptionButtons({
  onTranscribe,
  disabled,
  uploadStatus,
  selectedProvider
}: TranscriptionButtonsProps) {
  const isProcessing = uploadStatus === 'transcribing' || uploadStatus === 'analyzing';
  const isDisabled = disabled || isProcessing;

  const getButtonVariant = (provider: TranscriptionProviderType) => {
    if (selectedProvider === provider && isProcessing) {
      return 'default' as const;
    }
    return 'outline' as const;
  };

  const getButtonClassName = (provider: TranscriptionProviderType) => {
    if (selectedProvider === provider && isProcessing) {
      return 'shadow-sm';
    }
    return 'shadow-sm hover:bg-accent';
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="text-sm text-muted-foreground text-center mb-1">
        Choose transcription provider:
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {/* Whisper Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onTranscribe('whisper')}
              disabled={isDisabled}
              variant={getButtonVariant('whisper')}
              className={getButtonClassName('whisper')}
            >
              {isProcessing && selectedProvider === 'whisper' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mic className="h-4 w-4 mr-2" />
              )}
              <div className="flex flex-col items-start">
                <span className="font-semibold">Whisper</span>
                <span className="text-xs text-muted-foreground">$0.006/min</span>
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-semibold">OpenAI Whisper</p>
              <p>High accuracy transcription</p>
              <p className="text-xs text-muted-foreground mt-1">
                • 99+ languages<br/>
                • 25MB max file size<br/>
                • Word-level timestamps
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* DeepGram Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onTranscribe('deepgram')}
              disabled={isDisabled}
              variant={getButtonVariant('deepgram')}
              className={getButtonClassName('deepgram')}
            >
              {isProcessing && selectedProvider === 'deepgram' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              <div className="flex flex-col items-start">
                <span className="font-semibold">DeepGram</span>
                <span className="text-xs text-muted-foreground">$0.0043/min</span>
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-semibold">DeepGram Nova-3</p>
              <p>Fast, feature-rich transcription</p>
              <p className="text-xs text-muted-foreground mt-1">
                • 36+ languages<br/>
                • 2GB max file size<br/>
                • Smart formatting<br/>
                • Speaker diarization<br/>
                • Confidence scores
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Web Speech Fallback (Hidden by default) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => onTranscribe('web-speech')}
            disabled={isDisabled}
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
          >
            {isProcessing && selectedProvider === 'web-speech' ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Globe className="h-3 w-3 mr-1" />
            )}
            Use Browser (Free, Less Reliable)
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-semibold">Web Speech API</p>
            <p>Browser-based transcription</p>
            <p className="text-xs text-muted-foreground mt-1">
              • Free (no API cost)<br/>
              • Chrome/Edge only<br/>
              • Less reliable<br/>
              • No advanced features
            </p>
          </div>
        </TooltipContent>
      </Tooltip>

      {uploadStatus === 'error' && (
        <p className="text-xs text-destructive text-center mt-1">
          Transcription failed. Try a different provider.
        </p>
      )}
    </div>
  );
}
