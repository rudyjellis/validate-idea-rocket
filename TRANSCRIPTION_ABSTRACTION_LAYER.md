# Transcription Service Abstraction Layer

## Overview
A unified abstraction layer for multiple transcription providers (Whisper, DeepGram, Web Speech API). This architecture makes it easy to switch between providers or add new ones without changing application code.

## Architecture

### Design Pattern: Strategy Pattern
The abstraction layer uses the Strategy pattern to encapsulate different transcription algorithms (providers) and make them interchangeable.

```
┌─────────────────────────────────────────┐
│     Application Code (useVideoUpload)   │
└──────────────────┬──────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│   Transcription Service (index.ts)      │
│   • transcribeAudio()                   │
│   • compareProviders()                  │
│   • getProviderCapabilities()           │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
┌──────────────┐    ┌──────────────┐
│   Whisper    │    │  DeepGram    │
│   Provider   │    │   Provider   │
└──────────────┘    └──────────────┘
        ↓                     ↓
┌──────────────┐    ┌──────────────┐
│ Netlify Fn   │    │ Netlify Fn   │
│ (Whisper)    │    │ (DeepGram)   │
└──────────────┘    └──────────────┘
        ↓                     ↓
┌──────────────┐    ┌──────────────┐
│  OpenAI API  │    │ DeepGram API │
└──────────────┘    └──────────────┘
```

## File Structure

```
src/services/transcription/
├── index.ts                    # Main service (public API)
├── types.ts                    # Shared types and interfaces
├── providers/
│   ├── whisper.ts             # Whisper provider implementation
│   ├── deepgram.ts            # DeepGram provider implementation
│   └── web-speech.ts          # Web Speech API provider
└── index.test.ts              # Unit tests
```

## Core Components

### 1. Types (`types.ts`)

#### TranscriptionProvider
```typescript
type TranscriptionProvider = 'whisper' | 'deepgram' | 'web-speech';
```

#### TranscriptionOptions
```typescript
interface TranscriptionOptions {
  provider: TranscriptionProvider;
  language?: string;
  model?: string;
  smartFormat?: boolean;
  diarize?: boolean;
  profanityFilter?: boolean;
  keywords?: string[];
}
```

#### TranscriptionResult
```typescript
interface TranscriptionResult {
  text: string;
  provider: TranscriptionProvider;
  duration?: number;
  language?: string;
  confidence?: number;
  processingTime?: number;
  metadata?: TranscriptionMetadata;
}
```

#### TranscriptionProvider Interface
```typescript
interface TranscriptionProvider {
  transcribe(
    audioBlob: Blob,
    options: TranscriptionOptions,
    onProgress?: TranscriptionProgressCallback
  ): Promise<TranscriptionResult>;
  
  validateAudio(audioBlob: Blob): boolean;
  
  getCapabilities(): {
    maxFileSize: number;
    supportedFormats: string[];
    supportsDiarization: boolean;
    supportsSmartFormat: boolean;
    supportsConfidenceScores: boolean;
    supportsTimestamps: boolean;
  };
}
```

### 2. Main Service (`index.ts`)

#### transcribeAudio()
Main function to transcribe audio with any provider.

```typescript
const result = await transcribeAudio(audioBlob, {
  provider: 'whisper',
  language: 'en',
  smartFormat: true
});
```

#### compareProviders()
Compare multiple providers side-by-side.

```typescript
const results = await compareProviders(
  audioBlob,
  ['whisper', 'deepgram']
);
```

#### getProviderCapabilities()
Get capabilities of a specific provider.

```typescript
const caps = await getProviderCapabilities('deepgram');
console.log(caps.supportsDiarization); // true
```

### 3. Provider Implementations

Each provider implements the `TranscriptionProvider` interface:

#### WhisperProvider (`providers/whisper.ts`)
- Uses OpenAI Whisper API
- 25MB max file size
- 99+ languages
- Word-level timestamps

#### DeepGramProvider (`providers/deepgram.ts`)
- Uses DeepGram Nova-3 API
- 2GB max file size
- 36+ languages
- Smart formatting, diarization, confidence scores

#### WebSpeechProvider (`providers/web-speech.ts`)
- Uses browser Web Speech API
- Free (no API cost)
- Chrome/Edge only
- Less reliable, no advanced features

## Usage Examples

### Basic Usage

```typescript
import { transcribeAudio } from '@/services/transcription';

// Transcribe with Whisper
const result = await transcribeAudio(audioBlob, {
  provider: 'whisper',
  language: 'en'
});

console.log(result.text);
console.log(result.duration);
console.log(result.processingTime);
```

### With Progress Callback

```typescript
const result = await transcribeAudio(
  audioBlob,
  { provider: 'deepgram', smartFormat: true },
  (status, percentage) => {
    console.log(`${status} - ${percentage}%`);
  }
);
```

### Compare Providers

```typescript
import { compareProviders } from '@/services/transcription';

const results = await compareProviders(
  audioBlob,
  ['whisper', 'deepgram'],
  { language: 'en', smartFormat: true }
);

console.log('Whisper:', results.get('whisper')?.text);
console.log('DeepGram:', results.get('deepgram')?.text);
```

### In React Hook

```typescript
import { transcribeAudio } from '@/services/transcription';

const uploadAndGenerateMVP = async (
  recordedChunks: Blob[],
  provider: 'whisper' | 'deepgram'
) => {
  // Extract audio
  const audioBlob = await extractAudio(videoBlob);
  
  // Transcribe with selected provider
  const result = await transcribeAudio(audioBlob, {
    provider,
    language: 'en',
    smartFormat: true
  });
  
  // Generate MVP with transcript
  const mvpContent = await generateMVPDocument(result.text);
  
  return { mvpContent, transcript: result.text };
};
```

## Adding a New Provider

To add a new transcription provider (e.g., AssemblyAI):

### Step 1: Update Types
```typescript
// types.ts
export type TranscriptionProvider = 
  | 'whisper' 
  | 'deepgram' 
  | 'web-speech'
  | 'assemblyai'; // NEW
```

### Step 2: Create Provider Implementation
```typescript
// providers/assemblyai.ts
import type { TranscriptionProvider } from '../types';

export class AssemblyAIProvider implements TranscriptionProvider {
  async transcribe(audioBlob, options, onProgress) {
    // Implementation
  }
  
  validateAudio(audioBlob) {
    // Validation logic
  }
  
  getCapabilities() {
    return {
      maxFileSize: 5 * 1024 * 1024 * 1024,
      supportedFormats: ['audio/wav', 'audio/mp3'],
      supportsDiarization: true,
      supportsSmartFormat: true,
      supportsConfidenceScores: true,
      supportsTimestamps: true
    };
  }
}
```

### Step 3: Register Provider
```typescript
// index.ts
async function getProvider(providerName: TranscriptionProviderType) {
  switch (providerName) {
    case 'whisper':
      // ...
    case 'deepgram':
      // ...
    case 'assemblyai': // NEW
      if (!assemblyaiProvider) {
        const module = await import('./providers/assemblyai');
        assemblyaiProvider = new module.AssemblyAIProvider();
      }
      return assemblyaiProvider;
    // ...
  }
}
```

### Step 4: Create Netlify Function
```javascript
// netlify/functions/transcribe-assemblyai.js
exports.handler = async (event) => {
  // Call AssemblyAI API
};
```

### Step 5: Update UI
```typescript
// TranscriptionButtons.tsx
<Button onClick={() => onTranscribe('assemblyai')}>
  AssemblyAI
</Button>
```

That's it! The abstraction layer handles the rest.

## Benefits

### 1. Easy Provider Switching
Change provider with one line:
```typescript
// Before
const result = await transcribeAudio(audioBlob, { provider: 'whisper' });

// After
const result = await transcribeAudio(audioBlob, { provider: 'deepgram' });
```

### 2. A/B Testing
Compare providers easily:
```typescript
const results = await compareProviders(audioBlob, ['whisper', 'deepgram']);
```

### 3. Consistent Interface
All providers return the same structure:
```typescript
interface TranscriptionResult {
  text: string;
  provider: string;
  duration?: number;
  // ... consistent fields
}
```

### 4. Type Safety
TypeScript ensures correct usage:
```typescript
// ✅ Valid
transcribeAudio(audioBlob, { provider: 'whisper' });

// ❌ Type error
transcribeAudio(audioBlob, { provider: 'invalid' });
```

### 5. Lazy Loading
Providers are loaded only when needed:
```typescript
// Whisper code only loaded when used
await transcribeAudio(audioBlob, { provider: 'whisper' });
```

### 6. Testability
Easy to mock providers in tests:
```typescript
vi.mock('./providers/whisper', () => ({
  WhisperProvider: mockWhisperProvider
}));
```

## Provider Comparison

| Feature | Whisper | DeepGram | Web Speech |
|---------|---------|----------|------------|
| **Cost** | $0.006/min | $0.0043/min | Free |
| **Max File** | 25MB | 2GB | Unlimited |
| **Languages** | 99+ | 36+ | Limited |
| **Diarization** | ❌ | ✅ | ❌ |
| **Smart Format** | ❌ | ✅ | ❌ |
| **Confidence** | ❌ | ✅ | ❌ |
| **Timestamps** | ✅ | ✅ | ❌ |
| **Reliability** | High | High | Low |
| **Browser Req** | None | None | Chrome/Edge |

## Testing

### Unit Tests
```bash
npm test -- src/services/transcription/index.test.ts
```

### Integration Tests
```bash
npm test -- src/hooks/useVideoUpload.integration.test.ts
```

### Manual Testing
1. Record a video
2. Click "Whisper" button
3. Wait for transcription
4. Click "DeepGram" button
5. Compare results

## Performance

### Lazy Loading
Providers are loaded on-demand:
- Initial bundle: ~5KB (types only)
- Whisper loaded: +15KB
- DeepGram loaded: +18KB
- Web Speech loaded: +12KB

### Caching
Provider instances are cached:
```typescript
// First call: loads provider
await transcribeAudio(audioBlob, { provider: 'whisper' });

// Second call: uses cached provider
await transcribeAudio(audioBlob, { provider: 'whisper' });
```

## Error Handling

### TranscriptionError
All providers throw consistent errors:
```typescript
try {
  await transcribeAudio(audioBlob, { provider: 'whisper' });
} catch (error) {
  if (error instanceof TranscriptionError) {
    console.log(error.provider); // 'whisper'
    console.log(error.code);     // 'API_ERROR'
    console.log(error.message);  // 'Transcription failed'
  }
}
```

### Error Codes
- `INVALID_AUDIO`: Audio file is invalid
- `UNSUPPORTED_BROWSER`: Browser doesn't support provider
- `API_ERROR`: API request failed
- `TRANSCRIPTION_FAILED`: General transcription failure
- `UNKNOWN_PROVIDER`: Provider not found

## Migration Guide

### From Old Code
```typescript
// OLD: Direct Web Speech API usage
import { transcribeVideoWithProgress } from '@/services/transcription';
const transcript = await transcribeVideoWithProgress(videoBlob);

// NEW: Abstraction layer
import { transcribeAudio } from '@/services/transcription';
const result = await transcribeAudio(audioBlob, { 
  provider: 'web-speech' 
});
const transcript = result.text;
```

### From Whisper Branch
```typescript
// OLD: Direct Whisper service
import { transcribeAudioWithWhisper } from '@/services/whisper';
const result = await transcribeAudioWithWhisper(audioBlob);

// NEW: Abstraction layer
import { transcribeAudio } from '@/services/transcription';
const result = await transcribeAudio(audioBlob, { 
  provider: 'whisper' 
});
```

## Future Enhancements

### 1. Provider Selection UI
- Dropdown to select provider
- Show provider capabilities
- Display cost estimates

### 2. Automatic Provider Selection
```typescript
// Auto-select best provider based on criteria
const result = await transcribeAudio(audioBlob, {
  provider: 'auto', // NEW
  criteria: 'cost' | 'speed' | 'accuracy'
});
```

### 3. Fallback Chain
```typescript
// Try providers in order until one succeeds
const result = await transcribeAudio(audioBlob, {
  providers: ['deepgram', 'whisper', 'web-speech']
});
```

### 4. Caching
```typescript
// Cache transcription results
const result = await transcribeAudio(audioBlob, {
  provider: 'whisper',
  cache: true
});
```

### 5. Batch Processing
```typescript
// Transcribe multiple files
const results = await transcribeBatch(audioBlobs, {
  provider: 'deepgram'
});
```

## Conclusion

The transcription abstraction layer provides:
- ✅ **Flexibility**: Easy to switch providers
- ✅ **Extensibility**: Simple to add new providers
- ✅ **Consistency**: Unified interface for all providers
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Testability**: Easy to mock and test
- ✅ **Performance**: Lazy loading and caching

This architecture ensures the application can adapt to changing requirements without major refactoring.

---

**Version**: 1.0  
**Created**: 2025-01-22  
**Branch**: `feature/deepgram-api-transcription`  
**Status**: ✅ Implemented
