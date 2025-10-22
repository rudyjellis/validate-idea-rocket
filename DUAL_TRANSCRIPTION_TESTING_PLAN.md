# Dual Transcription Testing Plan
## A/B Testing Interface for Whisper vs DeepGram

## Overview
Create a testing interface with two separate buttons to process video recordings using different transcription providers (Whisper and DeepGram) before sending to Claude for MVP document generation.

## Goals
1. **Side-by-side comparison** of Whisper vs DeepGram transcription quality
2. **Performance testing** - Compare speed, accuracy, cost
3. **User experience testing** - Which provides better results?
4. **Easy switching** - Toggle between providers without code changes
5. **Maintain existing flow** - Don't break current functionality

## Architecture Design

### Current Flow
```
Video Recording → Audio Extraction → Web Speech API → Claude → MVP Document
```

### New Flow (Dual Testing)
```
Video Recording → Audio Extraction
                      ↓
        ┌─────────────┴─────────────┐
        ↓                           ↓
   [Whisper Button]          [DeepGram Button]
        ↓                           ↓
   Whisper API              DeepGram API
        ↓                           ↓
        └─────────────┬─────────────┘
                      ↓
              Claude Analysis
                      ↓
              MVP Document
```

## Implementation Strategy

### Option 1: Unified Service with Provider Selection (RECOMMENDED)
**Best for**: Clean architecture, easy maintenance, scalable

### Option 2: Separate Hooks for Each Provider
**Best for**: Complete isolation, independent testing

### Option 3: Feature Flag Toggle
**Best for**: Production A/B testing, gradual rollout

## Recommended Approach: Option 1

### Why Option 1?
- Single source of truth for transcription logic
- Easy to add more providers later (AssemblyAI, Google, etc.)
- Cleaner UI/UX with provider selection
- Better code reusability
- Easier testing and maintenance

## Implementation Plan

### Phase 1: Create Transcription Service Abstraction

#### File: `src/services/transcription/types.ts`
```typescript
export type TranscriptionProvider = 'whisper' | 'deepgram' | 'web-speech';

export interface TranscriptionOptions {
  provider: TranscriptionProvider;
  language?: string;
  model?: string;
  smartFormat?: boolean;
  diarize?: boolean;
}

export interface TranscriptionResult {
  text: string;
  provider: TranscriptionProvider;
  duration?: number;
  language?: string;
  confidence?: number;
  processingTime?: number;
  metadata?: {
    words?: any[];
    paragraphs?: any[];
    speakers?: any[];
  };
}

export interface TranscriptionError {
  provider: TranscriptionProvider;
  message: string;
  code?: string;
}
```

#### File: `src/services/transcription/index.ts`
```typescript
import { transcribeAudioWithWhisper } from './whisper';
import { transcribeAudioWithDeepGram } from './deepgram';
import { transcribeWithWebSpeech } from './web-speech';

export async function transcribeAudio(
  audioBlob: Blob,
  options: TranscriptionOptions,
  onProgress?: (status: string) => void
): Promise<TranscriptionResult> {
  
  switch (options.provider) {
    case 'whisper':
      return await transcribeAudioWithWhisper(audioBlob, options, onProgress);
    
    case 'deepgram':
      return await transcribeAudioWithDeepGram(audioBlob, options, onProgress);
    
    case 'web-speech':
      return await transcribeWithWebSpeech(audioBlob, options, onProgress);
    
    default:
      throw new Error(`Unknown provider: ${options.provider}`);
  }
}
```

### Phase 2: Update UI Components

#### File: `src/components/video-recorder/components/TranscriptionButtons.tsx` (NEW)
```typescript
import { Button } from "@/components/ui/button";
import { Loader2, Mic, Zap } from "lucide-react";

interface TranscriptionButtonsProps {
  onTranscribe: (provider: 'whisper' | 'deepgram') => void;
  disabled?: boolean;
  isProcessing?: boolean;
  currentProvider?: 'whisper' | 'deepgram' | null;
}

export function TranscriptionButtons({
  onTranscribe,
  disabled,
  isProcessing,
  currentProvider
}: TranscriptionButtonsProps) {
  
  return (
    <div className="flex gap-2">
      <Button
        onClick={() => onTranscribe('whisper')}
        disabled={disabled || isProcessing}
        variant={currentProvider === 'whisper' ? 'default' : 'outline'}
        className="flex-1"
      >
        {isProcessing && currentProvider === 'whisper' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Mic className="h-4 w-4 mr-2" />
        )}
        Whisper
      </Button>
      
      <Button
        onClick={() => onTranscribe('deepgram')}
        disabled={disabled || isProcessing}
        variant={currentProvider === 'deepgram' ? 'default' : 'outline'}
        className="flex-1"
      >
        {isProcessing && currentProvider === 'deepgram' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Zap className="h-4 w-4 mr-2" />
        )}
        DeepGram
      </Button>
    </div>
  );
}
```

### Phase 3: Update Video Upload Hook

#### File: `src/hooks/useVideoUpload.ts` (UPDATED)
```typescript
export function useVideoUpload() {
  const [selectedProvider, setSelectedProvider] = useState<TranscriptionProvider | null>(null);
  const [transcriptionResults, setTranscriptionResults] = useState<{
    whisper?: TranscriptionResult;
    deepgram?: TranscriptionResult;
  }>({});

  const transcribeWithProvider = useCallback(async (
    recordedChunks: Blob[],
    provider: 'whisper' | 'deepgram'
  ) => {
    setSelectedProvider(provider);
    setUploadStatus('transcribing');
    
    // Extract audio
    const audioBlob = await extractAudioWithProgress(videoBlob, ...);
    
    // Transcribe with selected provider
    const result = await transcribeAudio(audioBlob, {
      provider,
      smartFormat: true,
      language: 'en'
    }, onProgress);
    
    // Store result
    setTranscriptionResults(prev => ({
      ...prev,
      [provider]: result
    }));
    
    return result;
  }, []);

  const generateMVPWithProvider = useCallback(async (
    provider: 'whisper' | 'deepgram'
  ) => {
    const result = transcriptionResults[provider];
    if (!result) throw new Error('No transcription found');
    
    // Generate MVP with Claude
    const mvpContent = await generateMVPDocument(result.text);
    
    // Store document with provider info
    const document: MVPDocument = {
      content: mvpContent,
      transcript: result.text,
      provider: provider,
      transcriptionMetadata: result.metadata,
      createdAt: now.toISOString()
    };
    
    return document;
  }, [transcriptionResults]);

  return {
    transcribeWithProvider,
    generateMVPWithProvider,
    transcriptionResults,
    selectedProvider,
    // ... other exports
  };
}
```

### Phase 4: Create Comparison UI

#### File: `src/pages/TranscriptionComparison.tsx` (NEW)
```typescript
export function TranscriptionComparison() {
  const { transcriptionResults } = useVideoUpload();
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="border rounded p-4">
        <h3>Whisper Transcription</h3>
        {transcriptionResults.whisper && (
          <>
            <p>{transcriptionResults.whisper.text}</p>
            <div className="text-sm text-muted-foreground mt-2">
              Duration: {transcriptionResults.whisper.duration}s
              Processing: {transcriptionResults.whisper.processingTime}s
              Confidence: {transcriptionResults.whisper.confidence}
            </div>
          </>
        )}
      </div>
      
      <div className="border rounded p-4">
        <h3>DeepGram Transcription</h3>
        {transcriptionResults.deepgram && (
          <>
            <p>{transcriptionResults.deepgram.text}</p>
            <div className="text-sm text-muted-foreground mt-2">
              Duration: {transcriptionResults.deepgram.duration}s
              Processing: {transcriptionResults.deepgram.processingTime}s
              Confidence: {transcriptionResults.deepgram.confidence}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

## File Structure

```
src/
├── services/
│   ├── transcription/
│   │   ├── index.ts           # Main transcription service
│   │   ├── types.ts           # Shared types
│   │   ├── whisper.ts         # Whisper implementation
│   │   ├── deepgram.ts        # DeepGram implementation
│   │   └── web-speech.ts      # Web Speech API (fallback)
│   ├── anthropic.ts           # Claude integration
│   └── audioExtraction.ts     # Audio extraction
├── hooks/
│   └── useVideoUpload.ts      # Updated with provider selection
├── components/
│   └── video-recorder/
│       └── components/
│           ├── TranscriptionButtons.tsx  # NEW: Dual buttons
│           └── UploadButton.tsx          # Existing
└── pages/
    └── TranscriptionComparison.tsx       # NEW: Comparison view
```

## Testing Strategy

### 1. Unit Tests
- Test each provider independently
- Test transcription service abstraction
- Test error handling for each provider

### 2. Integration Tests
- Test full flow with Whisper
- Test full flow with DeepGram
- Test switching between providers

### 3. Manual Testing
Record same video, process with both:
- Compare transcription accuracy
- Compare processing speed
- Compare cost
- Compare features (formatting, confidence, etc.)

## Timeline

| Phase | Tasks | Time |
|-------|-------|------|
| Phase 1 | Service abstraction | 2-3 hours |
| Phase 2 | UI components | 2-3 hours |
| Phase 3 | Hook updates | 2-3 hours |
| Phase 4 | Comparison UI | 2-3 hours |
| Testing | All tests | 2-3 hours |
| **Total** | | **10-15 hours** |

## Detailed Implementation Steps

### Step 1: Merge Whisper Branch (Already Implemented)
```bash
# Whisper is already implemented on feature/whisper-api-transcription
git checkout feature/whisper-api-transcription
# Review implementation
```

### Step 2: Implement DeepGram on Separate Branch
```bash
# DeepGram implementation on feature/deepgram-api-transcription
git checkout feature/deepgram-api-transcription
# Implement DeepGram following same pattern as Whisper
```

### Step 3: Create Unified Testing Branch
```bash
# Create new branch from main
git checkout main
git checkout -b feature/dual-transcription-testing

# Cherry-pick or merge Whisper implementation
git cherry-pick <whisper-commits>

# Cherry-pick or merge DeepGram implementation
git cherry-pick <deepgram-commits>
```

### Step 4: Implement Abstraction Layer
Create unified transcription service that supports both providers.

### Step 5: Update UI with Dual Buttons
Replace single upload button with two provider-specific buttons.

### Step 6: Add Comparison View
Create side-by-side comparison of transcription results.

## Branch Strategy

### Recommended Approach
```
main
  ├── feature/whisper-api-transcription (DONE)
  ├── feature/deepgram-api-transcription (IN PROGRESS)
  └── feature/dual-transcription-testing (FUTURE)
       ├── Merge Whisper
       ├── Merge DeepGram
       └── Add abstraction + dual UI
```

### Alternative: Keep Separate Branches
```
main
  ├── feature/whisper-api-transcription
  │    └── Whisper implementation only
  ├── feature/deepgram-api-transcription
  │    └── DeepGram implementation only
  └── feature/transcription-comparison
       └── UI for testing both (imports from other branches)
```

## UI/UX Design

### Option A: Side-by-Side Buttons (RECOMMENDED)
```
┌─────────────────────────────────────┐
│  Video Preview                      │
│  [Recording Controls]               │
│                                     │
│  ┌──────────────┐  ┌──────────────┐│
│  │   Whisper    │  │  DeepGram    ││
│  │   $0.006/min │  │  $0.0043/min ││
│  └──────────────┘  └──────────────┘│
│                                     │
│  [Generate MVP with Selected]      │
└─────────────────────────────────────┘
```

### Option B: Dropdown Selection
```
┌─────────────────────────────────────┐
│  Video Preview                      │
│  [Recording Controls]               │
│                                     │
│  Provider: [Whisper ▼]             │
│                                     │
│  [Transcribe & Generate MVP]       │
└─────────────────────────────────────┘
```

### Option C: Tabs (Best for Comparison)
```
┌─────────────────────────────────────┐
│  Video Preview                      │
│  [Recording Controls]               │
│                                     │
│  ┌─────────┐ ┌──────────┐          │
│  │ Whisper │ │ DeepGram │          │
│  └─────────┘ └──────────┘          │
│                                     │
│  [Transcription Result]             │
│  [Generate MVP]                     │
└─────────────────────────────────────┘
```

## Comparison Metrics to Track

### Transcription Quality
- Word accuracy (manual review)
- Punctuation quality
- Capitalization
- Speaker identification (if multi-speaker)

### Performance
- Processing time (seconds)
- API latency
- File size limits

### Cost
- Per-minute cost
- Total cost per video
- Monthly estimate

### Features
- Smart formatting
- Confidence scores
- Timestamps
- Language detection
- Diarization

### User Experience
- Ease of use
- Error handling
- Progress feedback
- Result clarity

## Testing Checklist

### Functional Testing
- [ ] Whisper button transcribes correctly
- [ ] DeepGram button transcribes correctly
- [ ] Both can generate MVP documents
- [ ] Results are stored separately
- [ ] Can switch between providers
- [ ] Error handling works for both

### Performance Testing
- [ ] Measure Whisper processing time
- [ ] Measure DeepGram processing time
- [ ] Compare accuracy on same video
- [ ] Test with various audio qualities

### Edge Cases
- [ ] Very short videos (<10s)
- [ ] Long videos (>5min)
- [ ] Poor audio quality
- [ ] Multiple speakers
- [ ] Background noise
- [ ] Different accents

### Cost Analysis
- [ ] Track API usage for both
- [ ] Calculate cost per video
- [ ] Project monthly costs
- [ ] Compare value for money

## Example Test Results Template

```markdown
## Test Video: 2-minute Startup Pitch

### Whisper Results
- Processing Time: 12.3s
- Confidence: N/A
- Cost: $0.012
- Transcript Quality: 9/10
- Features: Basic transcription
- Issues: None

### DeepGram Results
- Processing Time: 8.7s
- Confidence: 0.97
- Cost: $0.0086
- Transcript Quality: 9.5/10
- Features: Smart formatting, confidence scores
- Issues: None

### Winner: DeepGram
- 29% faster
- 28% cheaper
- Better formatting
- Confidence scores
```

## Migration Path

### Phase 1: Testing (Current)
- Keep both providers on separate branches
- Test with dual buttons
- Gather metrics

### Phase 2: Decision
Based on testing results:
- **Option A**: Choose one provider (merge to main)
- **Option B**: Keep both (user choice)
- **Option C**: Use both (Whisper for X, DeepGram for Y)

### Phase 3: Production
- Merge chosen approach to main
- Remove unused provider code
- Update documentation
- Monitor production metrics

## Cost Projection

### Scenario: 100 videos/month, avg 2 minutes each

**Whisper Only**:
- 100 videos × 2 min × $0.006/min = $1.20/month
- Plus Claude: ~$2-4/month
- **Total**: ~$3-5/month

**DeepGram Only**:
- 100 videos × 2 min × $0.0043/min = $0.86/month
- Plus Claude: ~$2-4/month
- **Total**: ~$3-5/month

**Both (Testing)**:
- Whisper: $1.20/month
- DeepGram: $0.86/month
- Plus Claude: ~$2-4/month
- **Total**: ~$4-6/month

**Conclusion**: Testing both adds ~$1/month for 100 videos.

## Next Steps

### Immediate (This Session)
1. ✅ Create plan document
2. Review and approve plan
3. Decide on implementation approach

### Short Term (Next Session)
1. Implement DeepGram on separate branch
2. Create abstraction layer
3. Add dual button UI
4. Test both providers

### Long Term (After Testing)
1. Analyze results
2. Choose provider(s)
3. Merge to main
4. Deploy to production

---

**Status**: Planning Phase  
**Current Branch**: `feature/deepgram-api-transcription`  
**Recommendation**: Proceed with Option 1 (Unified Service with Dual Buttons)  
**Estimated Time**: 10-15 hours total implementation  
**Testing Period**: 1-2 weeks with real usage
