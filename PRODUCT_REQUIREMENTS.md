# Product Requirements Document: Validate Idea Rocket

## Executive Summary

**Product Name:** Validate Idea Rocket
**Version:** 1.0
**Last Updated:** October 23, 2025
**Purpose:** A web application that helps entrepreneurs validate their startup ideas by recording video pitches and automatically generating comprehensive MVP (Minimum Viable Product) documents using AI analysis.

## Product Overview

### Problem Statement
Entrepreneurs struggle to articulate and validate their startup ideas in a structured format. Traditional business planning is time-consuming and often results in overly complex documents that don't focus on core MVP features.

### Solution
A browser-based application that:
1. Records entrepreneurs' video pitches (with live transcription)
2. Analyzes the pitch using Claude AI (Anthropic)
3. Generates a structured MVP document with executive summary, problem statement, solution, target audience, core features, and success metrics
4. Provides downloadable video and transcript for archival purposes

### Target Users
- Early-stage entrepreneurs
- Startup founders
- Product managers exploring new ideas
- Innovation teams validating concepts

## Core Features

### 1. Video Recording with Live Transcription

**Description:** Record video pitches directly in the browser with real-time speech-to-text transcription.

**Functional Requirements:**
- Support both desktop and mobile browsers
- Maximum recording duration: 30 seconds (configurable)
- Live countdown before recording starts (3-2-1)
- Real-time transcription using Web Speech API
- Visual indicators for:
  - Recording status (red pulse indicator)
  - Time remaining
  - Transcription status (character count)
  - Browser compatibility warnings

**Technical Requirements:**
- Use MediaRecorder API for video capture
- Use Web Speech API for live transcription
- Support camera selection (front/back on mobile)
- Support microphone selection
- Video format: WebM/MP4
- Audio format: WAV for transcription

**User Controls:**
- Start recording
- Stop recording
- Pause/Resume (optional)
- Restart recording
- Download video (WebM or MP4)

**Constraints:**
- Browser must support MediaRecorder API
- Speech recognition only works in Chrome/Edge
- Requires camera and microphone permissions

### 2. AI-Powered MVP Analysis

**Description:** Analyze the transcribed pitch using Claude 4.5 Haiku to generate a structured MVP document.

**Functional Requirements:**
- Accept text transcript as input
- Generate comprehensive MVP document including:
  - Executive Summary
  - Problem Statement
  - Proposed Solution
  - Target Audience
  - Core MVP Features (prioritized)
  - Success Metrics and KPIs
  - Go-to-Market Strategy
  - Risk Assessment
  - Next Steps
- Processing time: < 30 seconds
- Visual progress indicators during analysis

**Technical Requirements:**
- Use Anthropic Claude 4.5 Haiku API
- Model: `claude-3-5-haiku-20241022`
- API Version: `2023-06-01`
- Max tokens: 4096
- Serverless function architecture (Netlify Functions)
- API key stored securely in environment variables

**MVP Prompt Framework:**
The system uses a structured prompt that analyzes pitches based on:
- Problem clarity and significance
- Solution feasibility and innovation
- Market understanding
- Feature prioritization
- Success criteria definition

### 3. Results Display and Export

**Description:** Display generated MVP document with options to download and review.

**Functional Requirements:**
- Display formatted MVP document (markdown rendered as HTML)
- Download options:
  - MVP document as TXT file
  - Video recording (WebM or MP4)
  - Transcript as TXT file
- Share/copy functionality
- Option to record another pitch

**UI/UX Requirements:**
- Clean, readable typography
- Proper heading hierarchy
- Responsive layout (mobile and desktop)
- Smooth animations and transitions
- Loading states with progress indicators

## Technical Architecture

### Tech Stack

**Frontend:**
- React 18.3+ (TypeScript)
- Vite (build tool)
- React Router (navigation)
- Tailwind CSS (styling)
- shadcn/ui (component library)
- Lucide React (icons)

**Backend:**
- Netlify Functions (serverless)
- Node.js 18+
- Anthropic SDK

**APIs:**
- Anthropic Claude API (AI analysis)
- Web Speech API (browser transcription)
- MediaRecorder API (video recording)

**Testing:**
- Vitest (unit/integration tests)
- React Testing Library
- 118 total tests

**Linting/Formatting:**
- ESLint
- TypeScript strict mode

### Application Architecture

```
┌─────────────────────────────────────────────┐
│           Browser (Client)                  │
│                                             │
│  ┌───────────────────────────────────┐    │
│  │   Video Recorder Component        │    │
│  │   - MediaRecorder                 │    │
│  │   - Web Speech API (live)         │    │
│  └───────────────────────────────────┘    │
│              ↓                              │
│  ┌───────────────────────────────────┐    │
│  │   Upload & Analysis Hook          │    │
│  │   - Validates transcript          │    │
│  │   - Calls Netlify Function        │    │
│  └───────────────────────────────────┘    │
│              ↓                              │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│      Netlify Functions (Serverless)         │
│                                             │
│  ┌───────────────────────────────────┐    │
│  │   generate-mvp.js                 │    │
│  │   - Receives transcript           │    │
│  │   - Calls Claude API              │    │
│  │   - Returns MVP document          │    │
│  └───────────────────────────────────┘    │
│              ↓                              │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│        Anthropic Claude API                 │
│        (claude-3-5-haiku-20241022)          │
└─────────────────────────────────────────────┘
```

### Key Components Structure

```
src/
├── components/
│   ├── video-recorder/
│   │   ├── VideoRecorder.tsx          # Main recorder component
│   │   ├── components/
│   │   │   ├── DesktopVideoRecorder.tsx
│   │   │   ├── MobileVideoRecorder.tsx
│   │   │   ├── TranscriptionIndicator.tsx  # NEW
│   │   │   ├── RecordingControls.tsx
│   │   │   └── VideoPreview.tsx
│   │   └── hooks/
│   │       ├── useVideoRecording.ts
│   │       ├── useRecorderLogic.ts
│   │       ├── useLiveTranscription.ts     # NEW
│   │       ├── useMediaRecorder.ts
│   │       └── useCameraDevices.ts
│   └── ui/                            # shadcn/ui components
├── hooks/
│   └── useVideoUpload.ts              # Upload & analysis logic
├── services/
│   ├── anthropic.ts                   # Claude API integration
│   └── audioExtraction.ts             # Audio processing utilities
├── pages/
│   ├── Index.tsx                      # Recording page
│   └── MVPResults.tsx                 # Results display page
└── App.tsx                            # Router configuration

netlify/
└── functions/
    └── generate-mvp.js                # Serverless AI analysis
```

## User Flows

### Primary Flow: Record and Analyze Pitch

1. **Landing Page**
   - User sees title: "Pitch the problem you're solving. Go!"
   - Camera preview automatically initializes
   - Microphone and camera selectors visible (desktop only)
   - Browser compatibility check runs automatically

2. **Recording Setup**
   - User selects preferred camera (if multiple available)
   - User selects preferred microphone (if multiple available)
   - System checks speech recognition support
   - Warning shown if browser doesn't support transcription

3. **Recording Process**
   - User clicks "Start Recording"
   - 3-2-1 countdown appears
   - Recording starts automatically after countdown
   - Red pulse indicator shows recording is active
   - Live transcription starts simultaneously
   - Transcription indicator shows:
     - "Transcribing... (X characters)" - if working
     - Warning message if not supported
     - Error message if transcription fails
   - Timer counts down from 30 seconds
   - User speaks their pitch

4. **Stopping Recording**
   - User clicks "Stop" or timer reaches 0
   - Recording and transcription stop simultaneously
   - Video chunks are collected
   - Final transcript is captured

5. **Validation**
   - System checks if transcript exists
   - If no transcript: Error shown, user can retry
   - If transcript exists: Proceed to analysis

6. **Analysis Phase**
   - User sees "Claude is analyzing your pitch..."
   - Progress indicator shows percentage
   - Transcript sent to Netlify function
   - Claude API processes the transcript
   - MVP document generated

7. **Results Display**
   - Navigate to results page automatically
   - Display formatted MVP document
   - Show download options:
     - Download MVP (TXT)
     - Download Video (MP4/WebM)
     - Download Transcript (TXT)
   - Option to "Record Another Pitch"

### Error Handling Flows

**No Camera/Microphone Permission:**
- Show error toast
- Provide instructions to enable permissions
- Block recording until granted

**Speech Recognition Not Supported:**
- Show warning banner
- Allow recording to continue
- Inform user they may need to retry in Chrome/Edge

**Transcription Failed:**
- Show error after recording stops
- Display message: "No transcript available"
- Provide retry option
- Suggest using Chrome/Edge

**API Analysis Failed:**
- Show error toast with specific message
- Preserve video and transcript
- Offer retry option
- Log error for debugging

## Data Models

### MVPDocument
```typescript
interface MVPDocument {
  content: string;           // Full MVP document in markdown
  transcript: string;        // Live transcription from recording
  createdAt: string;         // ISO 8601 timestamp
  transcriptFileName: string; // e.g., "pitch-analysis-2025-10-23.txt"
}
```

### LiveTranscriptionState
```typescript
interface LiveTranscriptionState {
  transcript: string;        // Final transcribed text
  isTranscribing: boolean;   // Recording status
  isSupported: boolean;      // Browser support flag
  error: string | null;      // Error message if any
  interimTranscript: string; // Partial/in-progress text
}
```

### RecordingState
```typescript
type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';
```

### UploadProgress
```typescript
interface UploadProgress {
  stage: 'analyzing';
  percentage: number;        // 0-100
  message: string;           // Status message
}
```

## API Specifications

### Netlify Function: generate-mvp

**Endpoint:** `/.netlify/functions/generate-mvp`

**Method:** POST

**Request Body:**
```json
{
  "transcript": "String - The transcribed pitch text"
}
```

**Response (Success):**
```json
{
  "content": "String - Generated MVP document in markdown format"
}
```

**Response (Error):**
```json
{
  "error": "String - Error message"
}
```

**Environment Variables Required:**
```
ANTHROPIC_API_KEY=sk-ant-...
```

**Rate Limits:**
- Depends on Anthropic API tier
- Recommended: Implement request throttling

**Error Codes:**
- 400: Missing or invalid transcript
- 401: Invalid API key
- 429: Rate limit exceeded
- 500: Internal server error

## UI/UX Requirements

### Design System

**Colors:**
- Primary: System default (adapts to dark/light mode)
- Success: Green (`green-600`)
- Error: Red (`red-600`)
- Warning: Yellow (`yellow-600`)
- Background: `bg-background`
- Foreground: `text-foreground`
- Card: `bg-card`

**Typography:**
- Font: System font stack
- Headings: Bold, size hierarchy (2xl → xl → lg)
- Body: Base size (16px equivalent)
- Code: Monospace

**Spacing:**
- Base unit: 4px (0.25rem)
- Common gaps: 4, 8, 16, 24, 32px

**Animations:**
- Pulse effect for recording indicator
- Smooth transitions (300ms ease-in-out)
- Progress bar animations
- Fade-in for messages

### Responsive Design

**Desktop (≥768px):**
- Max width: 4xl (896px) for recorder
- Centered layout
- Side-by-side selectors
- Full controls visible

**Mobile (<768px):**
- Full-screen recorder
- Stacked controls
- Bottom-sheet style controls
- Touch-optimized buttons
- Front camera preferred by default

### Accessibility

**Requirements:**
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader friendly
- Focus indicators
- Color contrast ratio: 4.5:1 minimum
- Alternative text for icons
- Status announcements for transcription

**WCAG Compliance:** Level AA

## Performance Requirements

### Loading Performance
- Initial page load: < 3 seconds
- Time to Interactive: < 5 seconds
- Lighthouse score: > 90

### Runtime Performance
- Video preview: 30 FPS minimum
- Transcription latency: < 2 seconds
- UI responsiveness: 60 FPS animations

### Network Performance
- API call timeout: 30 seconds
- Retry logic for failed requests
- Offline detection and messaging

## Browser Support

### Fully Supported
- Chrome 90+ (desktop and mobile)
- Edge 90+
- Safari 15+ (video only, no transcription)

### Partial Support
- Firefox 90+ (video only, no transcription)

### Not Supported
- Internet Explorer (any version)
- Opera Mini
- Old mobile browsers

### Feature Detection
```javascript
// Video Recording
const hasMediaRecorder = 'MediaRecorder' in window;

// Speech Recognition
const hasSpeechRecognition =
  'SpeechRecognition' in window ||
  'webkitSpeechRecognition' in window;

// Camera/Microphone
const hasMediaDevices =
  'mediaDevices' in navigator &&
  'getUserMedia' in navigator.mediaDevices;
```

## Security & Privacy

### Data Handling
- **Video:** Stored locally in browser, never uploaded to server
- **Transcript:** Sent to Claude API via secure HTTPS
- **API Keys:** Stored in environment variables, never exposed to client
- **User Data:** No personal data stored or tracked

### API Security
- HTTPS only
- API keys in environment variables
- Request validation
- Rate limiting
- CORS configuration

### Privacy Compliance
- No cookies used
- No analytics tracking
- No user accounts required
- No data persistence beyond session
- GDPR compliant (no personal data storage)

## Dependencies

### Core Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.28.0",
  "typescript": "^5.5.3",
  "@anthropic-ai/sdk": "^0.32.1"
}
```

### UI Dependencies
```json
{
  "tailwindcss": "^3.4.1",
  "@radix-ui/react-*": "^1.1.2",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.1",
  "lucide-react": "^0.454.0"
}
```

### Development Dependencies
```json
{
  "vite": "^5.4.1",
  "vitest": "^1.6.0",
  "@testing-library/react": "^14.3.1",
  "eslint": "^9.9.0"
}
```

## Environment Setup

### Required Environment Variables

```bash
# Anthropic API Key (required)
ANTHROPIC_API_KEY=sk-ant-api-key-here

# Optional: Claude Model Override
CLAUDE_MODEL=claude-3-5-haiku-20241022

# Optional: Max Recording Duration (seconds)
MAX_RECORDING_DURATION=30
```

### Development Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Create `.env` file with `ANTHROPIC_API_KEY`
4. Run dev server: `npm run dev`
5. Run tests: `npm test`
6. Run linting: `npm run lint`

### Production Deployment

**Recommended Platform:** Netlify

**Build Command:** `npm run build`

**Publish Directory:** `dist`

**Environment Variables:** Set in Netlify dashboard

**Functions Directory:** `netlify/functions`

## Testing Requirements

### Unit Tests
- All hooks must have unit tests
- All service functions must have unit tests
- Component logic must be tested
- Target coverage: > 80%

### Integration Tests
- Complete user flows tested end-to-end
- Video recording → Transcription → Analysis flow
- Error handling scenarios
- Browser compatibility checks

### Current Test Coverage
```
Test Files: 12 passed
Tests: 118 passed
Coverage: ~85%
```

### Test Commands
```bash
npm test              # Run all tests
npm run test:ui       # Run with UI
npm run test:coverage # Generate coverage report
```

## Known Limitations

### Technical Limitations
1. **Speech Recognition:**
   - Only works in Chrome/Edge
   - Requires active internet connection
   - May struggle with accents or background noise
   - Limited language support (English only currently)

2. **Video Recording:**
   - No server-side storage (client-side only)
   - File size limits based on browser
   - Format depends on browser codec support

3. **API Dependencies:**
   - Claude API rate limits apply
   - Costs per API call: ~$0.001 per request
   - Requires internet connection

### Future Improvements
1. Server-side video storage option
2. Multiple language support
3. Alternative transcription services (OpenAI Whisper)
4. User accounts and pitch history
5. Collaboration features
6. Export to additional formats (PDF, DOCX)

## Success Metrics

### Key Performance Indicators
- Successful recording completion rate: > 90%
- Transcription accuracy: > 85%
- MVP generation success rate: > 95%
- User satisfaction: > 4/5 stars
- Time to complete flow: < 2 minutes

### Analytics to Track
- Recording attempts
- Recording completions
- Transcription failures
- API errors
- Browser types
- Mobile vs desktop usage

## Support & Maintenance

### Error Monitoring
- Console logging for debugging
- Structured error messages
- User-friendly error displays

### Documentation
- README with setup instructions
- Code comments for complex logic
- API documentation
- Component documentation

### Updates
- Regular dependency updates
- Security patch monitoring
- Claude API version updates
- Browser compatibility testing

## Appendix

### MVP Prompt Template

The system uses this framework to analyze pitches:

```
Here is a transcript of a startup pitch video:

"[TRANSCRIPT]"

Based on this pitch, create a comprehensive MVP (Minimum Viable Product) document...

[Full prompt included in: netlify/functions/generate-mvp.js]
```

### File Size Estimates
- Average video (30s): ~2-5 MB
- Average transcript: ~500-1000 characters
- Average MVP document: ~2-4 KB

### Browser Permissions Required
- Camera access
- Microphone access
- (Optional) Clipboard access for sharing

---

**Document Version:** 1.0
**Created:** October 23, 2025
**Author:** AI Assistant (Claude)
**For:** Validate Idea Rocket MVP
