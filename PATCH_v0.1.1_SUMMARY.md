# Version 0.1.1 Patch Release

**Release Date**: 2025-10-20  
**Tag**: v0.1.1-stable  
**Commit**: 3f09787  
**Previous Version**: v0.1.0-stable  
**Live URL**: [validate.app.digerstudios.com](https://validate.app.digerstudios.com)

---

## What's Fixed in v0.1.1

### 1. ✅ Live Camera Preview Before Recording
**Problem**: Video window was black until you hit the record button  
**Solution**: Stream now displays immediately after camera initialization  
**Impact**: Better UX - users can see themselves before recording

### 2. ✅ Removed Duplicate Timer
**Problem**: Two timers were showing during recording (confusing UI)  
**Solution**: Removed duplicate RecordingTimer component  
**Impact**: Cleaner interface with single timer on the right side

### 3. ✅ Fixed Timer Reset on Pause
**Problem**: Timer would reset to 30s when paused, losing progress  
**Solution**: Added elapsed time tracking across pause/resume cycles  
**Impact**: Timer now correctly preserves time when paused

---

## Technical Changes

### Files Modified
- `src/components/video-recorder/VideoPreview.tsx`
  - Removed duplicate RecordingTimer component
  - Updated currentMode logic for preview

- `src/components/video-recorder/components/VideoElement.tsx`
  - Stream attaches whenever available (not just during recording)
  - Simplified stream attachment logic

- `src/components/video-recorder/hooks/useRecordingTimer.ts`
  - Added elapsedTimeRef to track time across pause/resume
  - Fixed pauseTimer to preserve elapsed time
  - Fixed startTimer to continue from elapsed time

---

## Rollback Instructions

If you need to rollback to v0.1.0:

```bash
git checkout v0.1.0-stable
npm ci
npm test -- --run
npm run dev
```

To rollback to v0.1.1 from a later version:

```bash
git checkout v0.1.1-stable
npm ci
npm test -- --run
npm run dev
```

---

## Version Comparison

| Feature | v0.1.0 | v0.1.1 |
|---------|--------|--------|
| Camera preview before recording | ❌ Black screen | ✅ Live preview |
| Timer display | ⚠️ Duplicate timers | ✅ Single timer |
| Pause/resume timer | ❌ Resets to 30s | ✅ Preserves time |
| Video recording | ✅ Working | ✅ Working |
| Test suite | ✅ 42 tests | ✅ 42 tests |
| Documentation | ✅ Complete | ✅ Complete |

---

## Testing Checklist

Before deploying v0.1.1, verify:

- [ ] Camera preview shows immediately after granting permissions
- [ ] Only one timer visible during recording
- [ ] Timer shows correct time remaining
- [ ] Pause button freezes timer at current time
- [ ] Resume button continues from paused time
- [ ] Recording completes successfully
- [ ] Playback works correctly
- [ ] Download works correctly

---

## Known Issues

None reported in v0.1.1

---

## Next Steps

Potential improvements for v0.1.2:
- Add visual feedback for pause state
- Improve loading state UI
- Add keyboard shortcuts
- Mobile-specific optimizations

---

**Status**: ✅ Stable and ready for use  
**Recommended**: Yes - All fixes improve UX without breaking changes
