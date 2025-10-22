# DeepGram API Implementation Plan

## Overview
This document outlines the plan to integrate DeepGram's Speech-to-Text API for audio transcription as an alternative to the current Web Speech API approach, following the same pattern as the Whisper API integration.

## Current Architecture

### Current Flow (Main Branch)
1. **Video Recording** → User records video pitch
2. **Audio Extraction** (`src/services/audioExtraction.ts`) → Extract audio from video as WAV
3. **Web Speech API** (`src/services/transcription.ts`) → Browser-based transcription (unreliable)
4. **Claude Analysis** (`src/services/anthropic.ts`) → Generates MVP document from transcript
5. **Results Display** → Show MVP document to user

### Current Limitations
- Web Speech API is browser-dependent (Chrome/Edge only)
- Unreliable for pre-recorded audio
- No control over transcription quality
- Limited language support
- No advanced features (diarization, punctuation, etc.)

## DeepGram API Overview

### Key Features
- **High Accuracy**: Industry-leading transcription accuracy
- **Fast Processing**: Real-time and pre-recorded transcription
- **Advanced Features**:
  - Speaker diarization (identify different speakers)
  - Smart formatting (punctuation, capitalization)
  - Keyword boosting (improve accuracy for specific terms)
  - Language detection (36+ languages)
  - Profanity filtering
  - Redaction (PII removal)
  - Timestamps and confidence scores
- **Multiple Models**:
  - **Nova-3**: Latest model, best accuracy (recommended)
  - **Enhanced**: Powerful for uncommon words
  - **Base**: Cost-effective baseline
  - **Whisper Large**: OpenAI Whisper hosted by DeepGram

### Pricing (Pay As You Go)
- **Nova-3 (Monolingual)**: $0.0043/min pre-recorded, $0.0077/min streaming
- **Nova-3 (Multilingual)**: $0.0052/min pre-recorded, $0.0092/min streaming
- **Whisper Large**: $0.0048/min pre-recorded
- **Free Credits**: $200 credit to start, no credit card required
- **Growth Plan**: Save up to 20% with annual commitment

### Comparison with Whisper
| Feature | DeepGram Nova-3 | OpenAI Whisper | Web Speech API |
|---------|----------------|----------------|----------------|
| **Cost** | $0.0043/min | $0.006/min | Free (browser) |
| **Accuracy** | Excellent | Excellent | Poor |
| **Speed** | Very Fast | Fast | Slow |
| **Languages** | 36+ | 99+ | Limited |
| **Diarization** | ✅ Yes | ❌ No | ❌ No |
| **Smart Format** | ✅ Yes | ❌ No | ❌ No |
| **Reliability** | ✅ High | ✅ High | ❌ Low |
| **Max File Size** | 2GB | 25MB | N/A |
| **Deployment** | Cloud/Self-hosted | Cloud only | Browser only |

**Verdict**: DeepGram is **cheaper** and **more feature-rich** than Whisper, with better formatting and speaker identification.

## Proposed DeepGram Integration

### Goals
1. **Replace Web Speech API** - Use DeepGram for reliable transcription
2. **Improve transcription quality** - Leverage Nova-3 model
3. **Add advanced features** - Speaker diarization, smart formatting
4. **Provide transcript visibility** - Show users the actual transcript
5. **Enable transcript editing** - Allow users to correct errors (future)
6. **Maintain security** - Keep API keys server-side in Netlify functions

### New Architecture

```
Video Recording
    ↓
Audio Extraction (existing)
    ↓
DeepGram API Transcription (NEW)
    ↓
Show/Edit Transcript (NEW - optional)
    ↓
Claude Analysis (existing - use text transcript)
    ↓
MVP Document
```

**Advantages**:
- **28% cheaper** than Whisper ($0.0043/min vs $0.006/min)
- **Better formatting** - Smart punctuation, capitalization
- **Speaker diarization** - Identify different speakers in pitch
- **Larger file support** - 2GB vs 25MB (Whisper)
- **More features** - Keyword boosting, language detection, etc.
- **Faster processing** - Optimized for speed
- **Self-hosted option** - Enterprise deployment available

**Disadvantages**:
- Requires DeepGram API key (in addition to Anthropic)
- Additional API dependency
- Slightly more complex error handling

## Implementation Plan

### Phase 1: Backend Infrastructure (Netlify Function)

#### 1.1 Create DeepGram Transcription Function
**File**: `netlify/functions/transcribe-deepgram.js`

**Responsibilities**:
- Accept audio file (base64 encoded)
- Call DeepGram Speech-to-Text API
- Return transcription text with metadata
- Handle errors gracefully

**API Specification**:
```javascript
// Request
POST /.netlify/functions/transcribe-deepgram
{
  "audioData": "base64_encoded_audio",
  "mimeType": "audio/wav",
  "language": "en", // optional
  "options": {
    "model": "nova-3",
    "smart_format": true,
    "diarize": false,
    "punctuate": true,
    "utterances": false
  }
}

// Response (Success)
{
  "text": "transcribed text...",
  "duration": 45.2,
  "language": "en",
  "confidence": 0.98,
  "words": [...], // word-level timestamps
  "paragraphs": [...], // paragraph structure
  "speakers": [...] // if diarization enabled
}

// Response (Error)
{
  "error": "error message"
}
```

**Environment Variables**:
- `DEEPGRAM_API_KEY` - DeepGram API key (add to Netlify)

**Dependencies**:
- `@deepgram/sdk` npm package (add to package.json devDependencies)

#### 1.2 Update Environment Configuration
**Files**: 
- `.env.example` - Document DEEPGRAM_API_KEY
- Netlify Dashboard - Add DEEPGRAM_API_KEY environment variable

### Phase 2: Frontend Service Layer

#### 2.1 Create DeepGram Service
**File**: `src/services/deepgram.ts`

**Responsibilities**:
- Upload audio to DeepGram function
- Handle API responses
- Provide error types
- Progress callbacks

**API**:
```typescript
export class DeepGramAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'DeepGramAPIError';
  }
}

export interface DeepGramTranscriptionOptions {
  model?: 'nova-3' | 'enhanced' | 'base' | 'whisper-large';
  smartFormat?: boolean;
  diarize?: boolean;
  punctuate?: boolean;
  language?: string;
}

export interface DeepGramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
}

export interface DeepGramParagraph {
  sentences: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  start: number;
  end: number;
}

export interface DeepGramTranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
  confidence?: number;
  words?: DeepGramWord[];
  paragraphs?: DeepGramParagraph[];
  speakers?: Array<{
    speaker: number;
    text: string;
  }>;
}

export async function transcribeAudioWithDeepGram(
  audioBlob: Blob,
  options?: DeepGramTranscriptionOptions,
  onProgress?: (status: string) => void
): Promise<DeepGramTranscriptionResult>
```

#### 2.2 Update Anthropic Service
**File**: `src/services/anthropic.ts`

**Changes**:
- Already prioritizes text transcript (no changes needed)
- Maintains audio processing as fallback

### Phase 3: Hook Integration

#### 3.1 Update Video Upload Hook
**File**: `src/hooks/useVideoUpload.ts`

**Changes**:
1. Add DeepGram transcription step after audio extraction
2. Update progress messages
3. Store transcript with metadata (speakers, confidence)
4. Pass transcript to Claude
5. Update error handling

**New Flow**:
```typescript
// 1. Extract audio (existing)
const audioBlob = await extractAudioWithProgress(videoBlob, ...);

// 2. Transcribe with DeepGram (NEW)
setProgress({ stage: 'transcribing', percentage: 40, message: 'Transcribing with DeepGram...' });
const transcription = await transcribeAudioWithDeepGram(audioBlob, {
  model: 'nova-3',
  smartFormat: true,
  diarize: false, // Enable for multi-speaker detection
  punctuate: true
});

// 3. Generate MVP with transcript (existing)
setProgress({ stage: 'analyzing', percentage: 70, message: 'Analyzing pitch...' });
const mvpContent = await generateMVPDocument(transcription.text);

// 4. Store transcript and MVP
const document: MVPDocument = {
  content: mvpContent,
  transcript: transcription.text,
  transcriptMetadata: {
    duration: transcription.duration,
    confidence: transcription.confidence,
    language: transcription.language,
    speakers: transcription.speakers
  },
  createdAt: now.toISOString(),
  transcriptFileName: `pitch-transcript-${now.toISOString().split('T')[0]}.txt`
};
```

### Phase 4: UI Enhancements (Optional)

#### 4.1 Transcript Review Screen (Future Enhancement)
**File**: `src/pages/TranscriptReview.tsx` (NEW)

**Features**:
- Display transcript with timestamps
- Show speaker labels (if diarization enabled)
- Highlight low-confidence words
- Allow editing before analysis
- "Continue to Analysis" button

#### 4.2 Speaker Identification (Future Enhancement)
If diarization is enabled, show:
- Speaker 1: "I think this is a great idea..."
- Speaker 2: "Yes, and we can expand to..."

### Phase 5: Testing & Validation

#### 5.1 Unit Tests
- `src/services/deepgram.test.ts` - Test DeepGram service
- Update `src/hooks/useVideoUpload.integration.test.ts` - Test new flow

#### 5.2 Integration Tests
- Test complete flow: Video → Audio → DeepGram → Claude → Results
- Test error scenarios (API failures, network issues)
- Test with various audio qualities

#### 5.3 Manual Testing
- Record test videos with different:
  - Lengths (30s, 1min, 2min)
  - Audio qualities (clear, noisy, quiet)
  - Accents and speaking styles
  - Multiple speakers (test diarization)
- Compare DeepGram vs Web Speech API quality

### Phase 6: Deployment

#### 6.1 Environment Setup
1. Sign up for DeepGram account (free $200 credit)
2. Get API key from DeepGram console
3. Add `DEEPGRAM_API_KEY` to Netlify environment variables
4. Update `.env.example` with documentation
5. Test in Netlify dev environment

#### 6.2 Gradual Rollout
1. Deploy to staging/preview
2. Test with real recordings
3. Monitor error rates and API costs
4. Deploy to production

#### 6.3 Feature Flag (Optional)
Add feature flag to toggle between Web Speech API and DeepGram:
```typescript
const USE_DEEPGRAM = import.meta.env.VITE_USE_DEEPGRAM_TRANSCRIPTION === 'true';
```

## Cost Analysis

### Current Approach (Web Speech API)
- **Cost**: Free (browser-based)
- **Reliability**: Poor (browser-dependent)
- **Quality**: Low (especially for pre-recorded audio)

### DeepGram Approach
- **DeepGram Nova-3**: $0.0043 per minute
- **Claude 4.5 Haiku** (text only): ~$0.80 per million input tokens
- **Estimated cost per 2-min video**: 
  - DeepGram: $0.0086 (2 min × $0.0043)
  - Claude: ~$0.02-0.04 (text analysis)
  - **Total**: ~$0.03-0.05

### Whisper Comparison
- **Whisper**: $0.012 (2 min × $0.006)
- **DeepGram**: $0.0086 (2 min × $0.0043)
- **Savings**: 28% cheaper with DeepGram

**Conclusion**: DeepGram is the **most cost-effective** option with **superior features**.

## Advanced Features

### 1. Speaker Diarization
Identify different speakers in the pitch:
```typescript
const transcription = await transcribeAudioWithDeepGram(audioBlob, {
  model: 'nova-3',
  diarize: true
});

// Result:
// Speaker 0: "I'm the founder and I'll explain our vision."
// Speaker 1: "And I'm the CTO, I'll cover the technical side."
```

**Use Case**: Multi-person pitches, interviews, panel discussions

### 2. Keyword Boosting
Improve accuracy for specific terms (startup names, technical jargon):
```typescript
const transcription = await transcribeAudioWithDeepGram(audioBlob, {
  model: 'nova-3',
  keywords: ['SaaS', 'MVP', 'API', 'YourStartupName']
});
```

**Use Case**: Ensure proper transcription of company/product names

### 3. Language Detection
Automatically detect language:
```typescript
const transcription = await transcribeAudioWithDeepGram(audioBlob, {
  model: 'nova-3',
  detect_language: true
});

console.log('Detected language:', transcription.language); // 'en', 'es', 'fr', etc.
```

**Use Case**: Support international users

### 4. Profanity Filtering
Filter out profanity:
```typescript
const transcription = await transcribeAudioWithDeepGram(audioBlob, {
  model: 'nova-3',
  profanity_filter: true
});
```

**Use Case**: Professional transcripts

### 5. Redaction (PII Removal)
Automatically redact sensitive information:
```typescript
const transcription = await transcribeAudioWithDeepGram(audioBlob, {
  model: 'nova-3',
  redact: ['pci', 'ssn', 'email', 'phone_number']
});
```

**Use Case**: Privacy compliance, GDPR

## Risk Assessment

### Technical Risks
1. **API Reliability**: DeepGram API downtime
   - **Mitigation**: Implement fallback to Web Speech API (existing)
   
2. **Audio Format Compatibility**: DeepGram may not support all formats
   - **Mitigation**: Convert to WAV/MP3 before sending (already done)
   
3. **Transcription Quality**: DeepGram may struggle with heavy accents/noise
   - **Mitigation**: Allow user to edit transcript before analysis

### Business Risks
1. **Additional API Dependency**: Now dependent on DeepGram and Anthropic
   - **Mitigation**: Keep Web Speech API as fallback
   
2. **Cost Increase**: Moving from free (browser) to paid API
   - **Mitigation**: Monitor costs, implement usage limits, very affordable

### Security Risks
1. **API Key Exposure**: Need to manage another API key
   - **Mitigation**: Keep in Netlify environment variables (server-side only)

## Success Metrics

### Technical Metrics
- Transcription accuracy: >95% word accuracy
- Processing time: <15 seconds for 2-min video
- Error rate: <1% of requests
- API uptime: >99.9%

### User Experience Metrics
- User satisfaction with transcript quality
- Number of transcript edits per video
- Time from upload to results
- Completion rate (users who finish the flow)

### Cost Metrics
- Average cost per transcription
- Monthly API spend
- Cost per user
- ROI vs free Web Speech API

## Timeline Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Backend function + env setup | 2-3 hours |
| Phase 2 | Frontend service layer | 1-2 hours |
| Phase 3 | Hook integration | 2-3 hours |
| Phase 4 | UI enhancements (optional) | 3-4 hours |
| Phase 5 | Testing & validation | 2-3 hours |
| Phase 6 | Deployment & monitoring | 1-2 hours |
| **Total** | | **11-17 hours** |

*Note: Phase 4 (Transcript Review UI) is optional and can be done later*

## Implementation Order (Recommended)

### Minimal Viable Implementation (6-8 hours)
1. Create DeepGram Netlify function (Phase 1)
2. Create DeepGram service (Phase 2.1)
3. Update video upload hook (Phase 3)
4. Basic testing (Phase 5.1-5.2)
5. Deploy (Phase 6)

### Full Implementation (11-17 hours)
- All phases including transcript review UI and advanced features

## Next Steps

1. **Get Approval**: Review this plan with stakeholders
2. **Setup DeepGram Account**: Create account and get API key (free $200 credit)
3. **Install Dependencies**: Add `@deepgram/sdk` package
4. **Start Implementation**: Begin with Phase 1 (Backend function)
5. **Iterative Testing**: Test after each phase
6. **Deploy**: Gradual rollout to production

## Alternative Approaches Considered

### 1. Keep Web Speech API
**Approach**: Don't change anything
**Pros**: Free, no API dependency
**Cons**: Unreliable, poor quality, browser-dependent
**Decision**: Rejected - Quality is too poor for production

### 2. Use Whisper API
**Approach**: Use OpenAI Whisper (already implemented in separate branch)
**Pros**: Good quality, well-documented
**Cons**: More expensive ($0.006/min vs $0.0043/min), fewer features
**Decision**: DeepGram is better value

### 3. Use AssemblyAI
**Approach**: Use AssemblyAI transcription service
**Pros**: Good quality, similar features to DeepGram
**Cons**: More expensive, less flexible
**Decision**: Rejected - DeepGram offers better pricing and features

### 4. Use Google Speech-to-Text
**Approach**: Use Google Cloud Speech-to-Text
**Pros**: Good quality, Google infrastructure
**Cons**: More expensive, complex setup
**Decision**: Rejected - DeepGram is simpler and cheaper

## DeepGram vs Whisper: Detailed Comparison

| Feature | DeepGram Nova-3 | OpenAI Whisper |
|---------|----------------|----------------|
| **Pre-recorded Cost** | $0.0043/min | $0.006/min |
| **Streaming Cost** | $0.0077/min | N/A |
| **Max File Size** | 2GB | 25MB |
| **Supported Formats** | 40+ | 10+ |
| **Languages** | 36+ | 99+ |
| **Speaker Diarization** | ✅ Built-in | ❌ Not available |
| **Smart Formatting** | ✅ Built-in | ❌ Not available |
| **Keyword Boosting** | ✅ Yes | ❌ No |
| **Language Detection** | ✅ Yes | ✅ Yes |
| **Profanity Filter** | ✅ Yes | ❌ No |
| **PII Redaction** | ✅ Yes | ❌ No |
| **Timestamps** | ✅ Word-level | ✅ Word-level |
| **Confidence Scores** | ✅ Yes | ❌ No |
| **Paragraphs** | ✅ Yes | ❌ No |
| **Utterances** | ✅ Yes | ❌ No |
| **Self-Hosted** | ✅ Enterprise | ❌ No |
| **Free Credits** | $200 | N/A |
| **Processing Speed** | Very Fast | Fast |
| **Accuracy** | Excellent | Excellent |

**Winner**: **DeepGram** - Better features, lower cost, more flexible

## References

- [DeepGram Pricing](https://deepgram.com/pricing)
- [DeepGram Documentation](https://developers.deepgram.com/docs/getting-started-with-pre-recorded-audio)
- [DeepGram SDK (Node.js)](https://github.com/deepgram/deepgram-js-sdk)
- [DeepGram Features Overview](https://developers.deepgram.com/docs/features-overview)
- [Current Implementation: src/services/transcription.ts](./src/services/transcription.ts)
- [Current Implementation: src/hooks/useVideoUpload.ts](./src/hooks/useVideoUpload.ts)

---

**Document Version**: 1.0  
**Created**: 2025-01-22  
**Branch**: `feature/deepgram-api-transcription`  
**Status**: Planning Phase  
**Recommendation**: ✅ **Proceed with DeepGram** - Best value, most features, lowest cost
