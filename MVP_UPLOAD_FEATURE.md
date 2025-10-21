# MVP Upload Feature

## Overview
This feature allows users to upload their recorded videos to Claude (Anthropic AI) for automatic MVP document generation.

## New Files Added

### Services
- `src/services/anthropic.ts` - Anthropic API integration
  - Upload video files to Anthropic Files API
  - Generate MVP documents using Claude with video analysis
  - Error handling and validation

### Hooks
- `src/hooks/useVideoUpload.ts` - Video upload state management
  - Upload status tracking (idle, uploading, analyzing, success, error)
  - Progress tracking
  - Navigation to results page
  - Error handling

### Components
- `src/components/video-recorder/components/UploadButton.tsx` - Upload button UI
  - Brain icon for MVP generation
  - Loading states with spinner
  - Tooltip messages for different states
  - Error state handling

### Pages
- `src/pages/MVPResults.tsx` - MVP results display page
  - Shows generated MVP document
  - Markdown rendering
  - Download functionality
  - Navigation back to recorder

### Configuration
- `.env.example` - Environment variable template
  - `VITE_ANTHROPIC_API_KEY` - Required for API access

## Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Anthropic API key to `.env.local`:
   ```
   VITE_ANTHROPIC_API_KEY=your_actual_api_key_here
   ```

3. Get an API key from: https://console.anthropic.com/

## Usage

1. Record a video using the video recorder
2. Click the Brain icon button (Upload button) in the controls
3. Wait for upload and analysis (progress shown in button)
4. Automatically navigate to `/mvp-results` page
5. View, copy, or download the generated MVP document

## Integration Points

### DesktopRecordingControls
- Added `onUpload` prop
- Added `uploadStatus` prop
- Integrated UploadButton component
- Shows button when recording is available

### App.tsx
- Added route for `/mvp-results` page

### Types
- Added `onUpload?: () => void` to RecordingControlsProps

## Features Preserved

All Phase 1-4 video recorder features remain intact:
- ✅ Phase 1: Audio analyzer hook
- ✅ Phase 2: Audio visualizer with bars
- ✅ Phase 3: Combined recording timer/status
- ✅ Phase 4: Restart recording button

## API Limits

- Maximum file size: 30MB
- Supported formats: video/webm, video/mp4
- Claude model: claude-3-5-sonnet-20241022

## Error Handling

- File size validation
- API key validation
- Network error handling
- User-friendly error messages via toast notifications
