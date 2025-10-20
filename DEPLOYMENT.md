# Deployment Documentation

## Production Environment

**Live URL**: [validate.app.digerstudios.com](https://validate.app.digerstudios.com)  
**Current Version**: v0.1.1-stable  
**Last Deployed**: 2025-10-20  
**Status**: ✅ Live and operational

---

## Deployment Information

### Current Deployment
- **Version**: v0.1.1-stable
- **Commit**: 3f09787
- **Branch**: main
- **Environment**: Production

### Features Live
✅ Video recording (mobile + desktop)  
✅ Camera permission handling  
✅ Live camera preview  
✅ Recording controls (start, pause, resume, stop)  
✅ Timer display  
✅ Video playback  
✅ Video download  
✅ Responsive design  

---

## Deployment Process

### Prerequisites
- Node.js 20.x or higher
- npm or compatible package manager
- Access to deployment platform

### Build Commands
```bash
# Install dependencies
npm ci

# Run tests
npm test -- --run

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables
Currently no environment variables required for core functionality.

Future additions should be documented here.

---

## Version History

### v0.1.1-stable (Current)
**Deployed**: 2025-10-20  
**Changes**:
- Live camera preview before recording
- Single timer display
- Fixed pause/resume timer behavior

### v0.1.0-stable
**Deployed**: 2025-10-20  
**Changes**:
- Initial release
- Video recording functionality
- Test suite (42 tests)
- Camera permissions

---

## Monitoring

### Health Checks
- [ ] Camera permissions working
- [ ] Video recording functional
- [ ] Playback working
- [ ] Download working
- [ ] No console errors
- [ ] Mobile responsive

### Performance Metrics
- **Page Load**: Target < 3s
- **Camera Init**: Target < 2s
- **Recording Start**: Target < 500ms

---

## Rollback Procedure

If issues are detected in production:

### Quick Rollback to v0.1.0
```bash
git checkout v0.1.0-stable
npm ci
npm run build
# Deploy build to production
```

### Quick Rollback to v0.1.1
```bash
git checkout v0.1.1-stable
npm ci
npm run build
# Deploy build to production
```

---

## Support & Troubleshooting

### Common Issues

**Camera not working**
- Check browser permissions
- Verify HTTPS connection
- Test in different browser

**Black screen**
- Clear browser cache
- Check console for errors
- Verify camera permissions granted

**Recording fails**
- Check available disk space
- Verify browser supports MediaRecorder API
- Test with different camera

### Browser Compatibility

**Tested & Working**
- ✅ Chrome 120+ (Desktop)
- ✅ Chrome Mobile (Android)

**Should Work** (needs testing)
- ⚠️ Edge 120+
- ⚠️ Firefox 120+
- ⚠️ Safari 17+
- ⚠️ Safari Mobile (iOS)

---

## Deployment Checklist

Before deploying a new version:

- [ ] All tests passing (`npm test -- --run`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing completed
- [ ] Version tag created
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Rollback plan ready

---

## Contact Information

**Repository**: https://github.com/rudyjellis/validate-idea-rocket  
**Production URL**: https://validate.app.digerstudios.com  
**Documentation**: See README.md and version lock files

---

## Next Deployment

When deploying v0.1.2 or later:

1. Update this file with new version info
2. Create new version tag
3. Update VERSION_LOCK.md
4. Run full test suite
5. Deploy to production
6. Verify all features working
7. Update "Current Version" section above

---

**Last Updated**: 2025-10-20  
**Maintained By**: Development Team
