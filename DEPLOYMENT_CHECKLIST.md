# 🚀 Deployment Checklist - FFmpeg Fix

## Quick Summary
Fixed FFmpeg bundling issue that caused 35 video failures in production.

**Problem**: FFmpeg binary path was getting webpack-bundled into `.next/server/vendor-chunks/ffmpeg`
**Solution**: Dynamic runtime resolution with multiple fallback strategies

---

## ✅ Pre-Deployment Checklist

- [x] Fix implemented in codebase
- [x] `next.config.js` updated with webpack externals
- [x] `lib/ffmpeg-helper.ts` created
- [x] `lib/tts-generator.ts` updated
- [x] `lib/video-generator.ts` updated
- [x] Documentation created
- [ ] Changes committed to Git
- [ ] Changes pushed to GitHub
- [ ] Production deployment triggered

---

## 📝 Commit & Push Commands

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Fix FFmpeg bundling for production builds

- Exclude ffmpeg-static from webpack bundling in next.config.js
- Add lib/ffmpeg-helper.ts with multi-strategy path resolution
- Update lib/tts-generator.ts to use dynamic FFmpeg path
- Update lib/video-generator.ts to use dynamic FFmpeg path
- Add comprehensive documentation (FFMPEG_FIX_GUIDE.md)

Fixes #35 TTS/video generation failures in production
Resolves: .next/server/vendor-chunks/ffmpeg not found error"

# Push to GitHub
git push origin main
```

---

## 🔧 Deployment Steps

### Option A: Abacus.AI Auto-Deploy
1. Push changes to GitHub (commands above)
2. Abacus.AI should auto-detect and rebuild
3. Wait for deployment to complete
4. Verify in production

### Option B: Manual Deploy
```bash
# On production server
cd /path/to/video-news-creator

# Pull latest changes
git pull origin main

# Install dependencies
npm install --legacy-peer-deps

# Build
npm run build

# Restart server
npm start
```

---

## ✅ Post-Deployment Verification

### 1. Check FFmpeg Resolution
Look for this in production logs when creating a video:
```
✓ Using ffmpeg-static: /path/to/node_modules/ffmpeg-static/ffmpeg
```
or
```
✓ Using system ffmpeg
```

### 2. Test Video Generation
1. Go to your production app: `video-news-creator-ocx3cf.abacusai.app`
2. Create a new video with narration
3. Monitor the generation progress
4. Verify it completes successfully
5. Check the video has audio

### 3. Retry Failed Videos
You have 35 videos with ERROR status. After verifying the fix works:

1. Navigate to Videos dashboard
2. Filter by "ERROR" status
3. For each video:
   - Click "View Details"
   - Click "Retry"
   - Monitor completion

**Batch Retry Strategy:**
- Start with 5 videos to confirm fix works
- If successful, retry all remaining 30 videos

---

## 🎯 Success Criteria

- ✅ New videos generate without FFmpeg errors
- ✅ TTS audio conversion completes successfully
- ✅ Videos have narration/voiceover
- ✅ Retried ERROR videos complete successfully
- ✅ No `.next/server/vendor-chunks/ffmpeg` errors in logs

---

## 🐛 Troubleshooting

### If FFmpeg still not found:

**1. Verify ffmpeg-static is installed:**
```bash
ls -la node_modules/ffmpeg-static/ffmpeg
```

**2. Install system FFmpeg as backup:**
```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
ffmpeg -version
```

**3. Check permissions:**
```bash
chmod +x node_modules/ffmpeg-static/ffmpeg
```

**4. Clear build cache:**
```bash
rm -rf .next
npm run build
```

### If build fails:

**1. Clear node_modules:**
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**2. Check Node.js version:**
```bash
node --version  # Should be 18.x or 20.x
```

---

## 📊 Monitoring After Deployment

### Key Metrics to Watch
1. **Video Success Rate**: Should go from 30% to 90%+ (15/50 → 45+/50)
2. **TTS Error Count**: Should drop to 0
3. **FFmpeg Error Logs**: Should disappear

### Log Monitoring
```bash
# Watch production logs
# Look for:
✓ Using ffmpeg-static: [path]
✓ TTS audio generated successfully
✓ FFmpeg conversion completed
✓ Video generated successfully
```

---

## 💰 Cost Recovery

After successful deployment, document for Abacus.AI support:

**Email to:** support@abacus.ai

**Subject:** Credit Review Request - 35 Failed Video Attempts Due to FFmpeg Bug

**Body:**
```
Hi Abacus.AI Team,

I'm requesting a review of credits used for 35 failed video generation attempts.

Issue: FFmpeg binary path resolution bug in Next.js production builds
Error: ".next/server/vendor-chunks/ffmpeg: not found"
Failed Attempts: 35 videos (all TTS/FFmpeg failures)
Resolution: Fixed with webpack externals configuration

Database shows:
- 15 successful videos
- 35 error videos (all same FFmpeg issue)

Could you please review and potentially credit back the failed attempts?

GitHub repo with fix: https://github.com/dquillman/video-news-creator
Deployment: video-news-creator-ocx3cf.abacusai.app

Thank you for your consideration.
```

Attach:
- Screenshots of ERROR videos
- Database export showing error counts
- Link to FFMPEG_FIX_GUIDE.md

---

## 📚 Documentation Files

- `FFMPEG_FIX_GUIDE.md` - Technical implementation details
- `DEPLOYMENT_CHECKLIST.md` - This file
- `README.md` - Project overview
- `HANDOFF_TO_CLAUDE.md` - Original problem statement

---

## 🎉 Next Steps After Fix

1. ✅ Verify all 35 videos can be retried successfully
2. Monitor for 24 hours to ensure stability
3. Consider adding automated tests for FFmpeg availability
4. Update monitoring/alerting for FFmpeg errors
5. Document this fix in your internal knowledge base

---

**Estimated Time to Deploy:** 15-30 minutes
**Expected Downtime:** None (rolling update)
**Risk Level:** Low (backward compatible fallback strategies)

Good luck with the deployment! 🚀
