# Whisper API Implementation Plan

## Overview
This document outlines the plan to integrate OpenAI's Whisper API for audio transcription as an alternative to the current Claude-based audio processing approach.

## Current Architecture

### Current Flow
1. **Video Recording** → User records video pitch
2. **Audio Extraction** (`src/services/audioExtraction.ts`) → Extract audio from video as WAV
3. **Audio Upload** (`netlify/functions/upload-video.js`) → Upload audio to Claude Files API
4. **Claude Processing** (`netlify/functions/generate-mvp.js`) → Claude transcribes + analyzes in one step
5. **Results Display** → Show MVP document to user

### Current Components
- **Frontend**: `src/hooks/useVideoUpload.ts` - Orchestrates the upload flow
- **Services**: 
  - `src/services/audioExtraction.ts` - Extracts audio from video
  - `src/services/anthropic.ts` - Handles Claude API interactions
- **Backend Functions**:
  - `netlify/functions/upload-video.js` - Uploads audio to Claude
  - `netlify/functions/generate-mvp.js` - Generates MVP using Claude 4.5 Haiku

### Current Limitations
- Claude processes audio directly (transcription + analysis combined)
- No separate transcription step visible to user
- Limited control over transcription quality/format
- Tied to Claude's audio processing capabilities

## Proposed Whisper API Integration

### Goals
1. **Separate transcription from analysis** - Use Whisper for transcription, Claude for analysis
2. **Improve transcription quality** - Whisper is specialized for speech-to-text
3. **Provide transcript visibility** - Show users the actual transcript before analysis
4. **Enable transcript editing** - Allow users to correct transcription errors
5. **Maintain security** - Keep API keys server-side in Netlify functions

### New Architecture

#### Option A: Whisper → Claude (Recommended)
```
Video Recording
    ↓
Audio Extraction (existing)
    ↓
Whisper API Transcription (NEW)
    ↓
Show/Edit Transcript (NEW)
    ↓
Claude Analysis (modified - use text transcript)
    ↓
MVP Document
```

**Advantages**:
- Best transcription quality (Whisper specializes in speech-to-text)
- User can review/edit transcript before analysis
- Faster processing (Whisper is optimized for transcription)
- Lower cost (Whisper is cheaper than Claude for transcription)
- Separation of concerns (transcription vs analysis)

**Disadvantages**:
- Requires OpenAI API key in addition to Anthropic
- Additional API call (slight latency increase)
- More complex error handling

#### Option B: Whisper Only (Alternative)
```
Video Recording
    ↓
Audio Extraction (existing)
    ↓
Whisper API Transcription (NEW)
    ↓
Show/Edit Transcript (NEW)
    ↓
Claude Analysis (existing - use text transcript)
    ↓
MVP Document
```

**Advantages**:
- Same as Option A
- Can be implemented as a feature flag

**Disadvantages**:
- Same as Option A

## Implementation Plan

### Phase 1: Backend Infrastructure (Netlify Function)

#### 1.1 Create Whisper Transcription Function
**File**: `netlify/functions/transcribe-whisper.js`

**Responsibilities**:
- Accept audio file (base64 encoded)
- Call OpenAI Whisper API
- Return transcription text
- Handle errors gracefully

**API Specification**:
```javascript
// Request
POST /.netlify/functions/transcribe-whisper
{
  "audioData": "base64_encoded_audio",
  "mimeType": "audio/wav",
  "language": "en" // optional
}

// Response (Success)
{
  "text": "transcribed text...",
  "duration": 45.2,
  "language": "en"
}

// Response (Error)
{
  "error": "error message"
}
```

**Environment Variables**:
- `OPENAI_API_KEY` - OpenAI API key (add to Netlify)

**Dependencies**:
- `openai` npm package (add to package.json devDependencies)
- `form-data` (already installed)

#### 1.2 Update Environment Configuration
**Files**: 
- `.env.example` - Document OPENAI_API_KEY
- Netlify Dashboard - Add OPENAI_API_KEY environment variable

### Phase 2: Frontend Service Layer

#### 2.1 Create Whisper Service
**File**: `src/services/whisper.ts`

**Responsibilities**:
- Upload audio to Whisper function
- Handle API responses
- Provide error types
- Progress callbacks

**API**:
```typescript
export class WhisperAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'WhisperAPIError';
  }
}

export interface WhisperTranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
}

export async function transcribeAudioWithWhisper(
  audioBlob: Blob,
  onProgress?: (status: string) => void
): Promise<WhisperTranscriptionResult>
```

#### 2.2 Update Anthropic Service
**File**: `src/services/anthropic.ts`

**Changes**:
- Modify `generateMVPDocument()` to prioritize text transcript over audio
- Keep audio processing as fallback
- Update error handling

### Phase 3: Hook Integration

#### 3.1 Update Video Upload Hook
**File**: `src/hooks/useVideoUpload.ts`

**Changes**:
1. Add Whisper transcription step after audio extraction
2. Update progress messages
3. Store transcript separately
4. Pass transcript to Claude (not audio)
5. Update error handling

**New Flow**:
```typescript
// 1. Extract audio (existing)
const audioBlob = await extractAudioWithProgress(videoBlob, ...);

// 2. Transcribe with Whisper (NEW)
setProgress({ stage: 'transcribing', percentage: 40, message: 'Transcribing audio...' });
const transcription = await transcribeAudioWithWhisper(audioBlob, ...);

// 3. Generate MVP with transcript (modified)
setProgress({ stage: 'analyzing', percentage: 70, message: 'Analyzing pitch...' });
const mvpContent = await generateMVPDocument(transcription.text);

// 4. Store both transcript and MVP
const document: MVPDocument = {
  content: mvpContent,
  transcript: transcription.text, // Now we have actual transcript!
  createdAt: now.toISOString(),
  transcriptFileName: `pitch-transcript-${now.toISOString().split('T')[0]}.txt`
};
```

### Phase 4: UI Enhancements (Optional)

#### 4.1 Transcript Review Screen (Future Enhancement)
**File**: `src/pages/TranscriptReview.tsx` (NEW)

**Features**:
- Display transcript after Whisper processing
- Allow editing before analysis
- "Continue to Analysis" button
- Save edited transcript

**Flow**:
```
Video Upload → Whisper Transcription → Transcript Review → Claude Analysis → Results
```

### Phase 5: Backend Function Updates

#### 5.1 Update MVP Generation Function
**File**: `netlify/functions/generate-mvp.js`

**Changes**:
- Prioritize text transcript over audio data
- Keep audio processing as fallback
- Update logging

**Logic**:
```javascript
if (transcript) {
  // Use text transcript (from Whisper or edited by user)
  messageContent = `Here is a transcript...`;
} else if (audioData) {
  // Fallback to Claude audio processing
  messageContent = [{ type: 'document', source: {...} }, ...];
}
```

### Phase 6: Testing & Validation

#### 6.1 Unit Tests
- `src/services/whisper.test.ts` - Test Whisper service
- Update `src/hooks/useVideoUpload.integration.test.ts` - Test new flow

#### 6.2 Integration Tests
- Test complete flow: Video → Audio → Whisper → Claude → Results
- Test error scenarios (API failures, network issues)
- Test with various audio qualities

#### 6.3 Manual Testing
- Record test videos with different:
  - Lengths (30s, 1min, 2min)
  - Audio qualities (clear, noisy, quiet)
  - Accents and speaking styles
- Compare Whisper vs Claude transcription quality

### Phase 7: Deployment

#### 7.1 Environment Setup
1. Add `OPENAI_API_KEY` to Netlify environment variables
2. Update `.env.example` with documentation
3. Test in Netlify dev environment

#### 7.2 Gradual Rollout
1. Deploy to staging/preview
2. Test with real recordings
3. Monitor error rates and API costs
4. Deploy to production

#### 7.3 Feature Flag (Optional)
Add feature flag to toggle between Whisper and Claude transcription:
```typescript
const USE_WHISPER = import.meta.env.VITE_USE_WHISPER_TRANSCRIPTION === 'true';
```

## Cost Analysis

### Current Approach (Claude Audio Processing)
- **Claude 4.5 Haiku**: ~$0.80 per million input tokens
- **Audio processing**: Included in token cost
- **Estimated cost per 2-min video**: ~$0.05-0.10

### Whisper Approach
- **Whisper API**: $0.006 per minute
- **Claude 4.5 Haiku** (text only): ~$0.80 per million input tokens
- **Estimated cost per 2-min video**: 
  - Whisper: $0.012 (2 min × $0.006)
  - Claude: ~$0.02-0.04 (text analysis)
  - **Total**: ~$0.03-0.05

**Conclusion**: Whisper approach is comparable or slightly cheaper, with better transcription quality.

## Risk Assessment

### Technical Risks
1. **API Reliability**: Whisper API downtime
   - **Mitigation**: Implement fallback to Claude audio processing
   
2. **Audio Format Compatibility**: Whisper may not support all formats
   - **Mitigation**: Convert to WAV/MP3 before sending
   
3. **Transcription Quality**: Whisper may struggle with accents/noise
   - **Mitigation**: Allow user to edit transcript before analysis

### Business Risks
1. **Additional API Dependency**: Now dependent on both OpenAI and Anthropic
   - **Mitigation**: Keep Claude audio processing as fallback
   
2. **Cost Increase**: Two API calls instead of one
   - **Mitigation**: Monitor costs, implement usage limits

### Security Risks
1. **API Key Exposure**: Need to manage another API key
   - **Mitigation**: Keep in Netlify environment variables (server-side only)

## Success Metrics

### Technical Metrics
- Transcription accuracy: >95% word accuracy
- Processing time: <30 seconds for 2-min video
- Error rate: <1% of requests
- API uptime: >99.9%

### User Experience Metrics
- User satisfaction with transcript quality
- Number of transcript edits per video
- Time from upload to results
- Completion rate (users who finish the flow)

## Timeline Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Backend function + env setup | 2-3 hours |
| Phase 2 | Frontend service layer | 1-2 hours |
| Phase 3 | Hook integration | 2-3 hours |
| Phase 4 | UI enhancements (optional) | 3-4 hours |
| Phase 5 | Backend updates | 1 hour |
| Phase 6 | Testing & validation | 2-3 hours |
| Phase 7 | Deployment & monitoring | 1-2 hours |
| **Total** | | **12-18 hours** |

*Note: Phase 4 (Transcript Review UI) is optional and can be done later*

## Implementation Order (Recommended)

### Minimal Viable Implementation (6-8 hours)
1. Create Whisper Netlify function (Phase 1)
2. Create Whisper service (Phase 2.1)
3. Update video upload hook (Phase 3)
4. Update MVP generation function (Phase 5)
5. Basic testing (Phase 6.1-6.2)
6. Deploy (Phase 7)

### Full Implementation (12-18 hours)
- All phases including transcript review UI

## Next Steps

1. **Get Approval**: Review this plan with stakeholders
2. **Setup OpenAI Account**: Create account and get API key
3. **Install Dependencies**: Add `openai` package
4. **Start Implementation**: Begin with Phase 1 (Backend function)
5. **Iterative Testing**: Test after each phase
6. **Deploy**: Gradual rollout to production

## Alternative Approaches Considered

### 1. Client-Side Whisper
**Approach**: Use Whisper.cpp or Transformers.js in browser
**Pros**: No API costs, works offline
**Cons**: Large model size, slow on mobile, poor quality
**Decision**: Rejected - API approach is better for mobile-first app

### 2. Keep Claude Audio Processing
**Approach**: Don't change anything
**Pros**: Simple, already working
**Cons**: No transcript visibility, less control, combined transcription+analysis
**Decision**: Rejected - Whisper provides better separation of concerns

### 3. Use AssemblyAI or Deepgram
**Approach**: Use alternative transcription service
**Pros**: Specialized in transcription, good quality
**Cons**: Another vendor, similar cost to Whisper
**Decision**: Rejected - Whisper is industry standard and well-documented

## References

- [OpenAI Whisper API Documentation](https://platform.openai.com/docs/guides/speech-to-text)
- [Anthropic Claude API Documentation](https://docs.anthropic.com/claude/reference/messages_post)
- [Current Implementation: src/hooks/useVideoUpload.ts](./src/hooks/useVideoUpload.ts)
- [Current Implementation: netlify/functions/generate-mvp.js](./netlify/functions/generate-mvp.js)

---

**Document Version**: 1.0  
**Created**: 2025-01-22  
**Branch**: `feature/whisper-api-transcription`  
**Status**: Planning Phase
