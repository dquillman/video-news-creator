
# 🚀 Handoff to Claude - Video News Creator v1.3.3

## ✅ What's Done

Your code is **fully committed to Git** and ready to push to GitHub:

```bash
cd /home/ubuntu/video_news_creator/nextjs_space
git log --oneline
# 76d9a7f Add comprehensive README for Claude
# b0648a5 v1.3.3 - Current state before switching to Claude
```

## 📦 Current Status

- **Total Commits:** 2
- **Files Tracked:** 108 files
- **Database:** PostgreSQL with 15 successful + 35 error videos
- **Version:** v1.3.3
- **Main Issue:** FFmpeg path resolution in production

## 🔧 How to Push to GitHub

### Option 1: Create New GitHub Repo (Recommended)

1. Go to https://github.com/new
2. Create a repository named `video-news-creator`
3. Don't initialize with README (we already have one)
4. Copy the repository URL (e.g., `https://github.com/YOUR_USERNAME/video-news-creator.git`)

5. Push your code:
```bash
cd /home/ubuntu/video_news_creator/nextjs_space
git remote add origin https://github.com/YOUR_USERNAME/video-news-creator.git
git branch -M main
git push -u origin main
```

### Option 2: Use Existing Repo

```bash
cd /home/ubuntu/video_news_creator/nextjs_space
git remote add origin YOUR_EXISTING_REPO_URL
git push -u origin master
```

## 📋 What to Tell Claude

Copy this message when you start your conversation:

---

**Hi Claude! I need help fixing a Next.js video creation app. Here's the context:**

**GitHub Repo:** [YOUR_REPO_URL]

**Main Issue:** FFmpeg path resolution in production build
- Error: `Command failed: "/path/to/.next/server/vendor-chunks/ffmpeg" ... /bin/sh: 1: ffmpeg: not found`
- Dev mode works fine
- Production build breaks
- Using `ffmpeg-static` package but it's not resolving correctly

**Files to Check:**
1. `lib/tts-generator.ts` (lines 59-80) - TTS generation with FFmpeg
2. `lib/video-generator.ts` - Video assembly
3. `next.config.js` - Build configuration
4. `package.json` - Dependencies

**Database Stats:**
- 15 successful videos
- 35 error videos (all TTS/FFmpeg failures)

**Environment:**
- Next.js 14.2.28
- Node.js with yarn
- Python 3.11.6 (working correctly now)
- PostgreSQL + Prisma
- Deployed at: video-news-creator-ocx3cf.abacusai.app

**What I Need:**
Fix the FFmpeg bundling so TTS generation works in production. The app needs to:
1. Generate audio with gTTS (Python) - ✅ WORKS
2. Convert MP3 to WAV with FFmpeg - ❌ BROKEN
3. Assemble video with narration - ❌ BLOCKED

Please read the README.md in the repo for full context. Thanks!

---

## 📁 Files Overview

### Critical Files (The Issue)
- `lib/tts-generator.ts` - Uses ffmpeg-static for audio conversion (BROKEN)
- `lib/video-generator.ts` - Uses ffmpeg-static for video assembly (BROKEN)
- `next.config.js` - Build configuration

### Working Files
- All React components ✅
- All API routes ✅
- Database models ✅
- Python TTS generation ✅
- Pexels video fetching ✅

### Environment Files (NOT in Git)
- `.env` - Contains API keys
- `.env.local` - Local overrides
- `node_modules/` - Dependencies
- `temp/` - Generated files

## 🗂️ Repository Structure

```
video-news-creator/
└── nextjs_space/              ← Your code is here
    ├── app/
    │   ├── api/              ← API routes
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/            ← React components
    ├── lib/                   ← Core libraries (TTS, video gen)
    ├── prisma/               ← Database schema
    ├── public/               ← Static assets
    ├── scripts/              ← Utility scripts
    ├── package.json
    ├── next.config.js
    ├── .gitignore
    └── README.md             ← Full documentation for Claude
```

## 💾 Environment Variables to Share with Claude

**DO NOT** commit these, but Claude will need them:

```bash
DATABASE_URL="postgresql://role_48c75f005:vYdTt3vd10mMMLYrgVakoK10LULh7KJz@db-48c75f005.db003.hosteddb.reai.io:5432/48c75f005?connect_timeout=15"
PEXELS_API_KEY="[your key from .env]"
ABACUSAI_API_KEY="21183abe0805467386fcb91c66b022ec"
```

## 🔍 Debugging Info for Claude

### Last Error Message
```
TTS generation failed: Command failed: "/home/ubuntu/video_news_creator/nextjs_space/.next/server/vendor-chunks/ffmpeg" -y -i "/home/ubuntu/video_news_creator/nextjs_space/temp/audio/tts_1763080719669_temp.mp3" -af "atempo=1.15,asetrate=44100*0.95,aresample=44100" -ar 44100 -ac 2 "/home/ubuntu/video_news_creator/nextjs_space/temp/audio/tts_1763080719669_wtxwm3piy.wav"
/bin/sh: 1: /home/ubuntu/video_news_creator/nextjs_space/.next/server/vendor-chunks/ffmpeg: not found
```

### What Works
- ✅ Development mode (yarn dev)
- ✅ Python TTS generation
- ✅ Pexels video fetching
- ✅ Database operations
- ✅ UI/components
- ✅ AI image templates

### What's Broken
- ❌ FFmpeg in production build
- ❌ TTS audio conversion
- ❌ Video assembly with narration

## 📊 Database State

You have 50 videos in total:
- 15 COMPLETED (working videos)
- 35 ERROR (all TTS/FFmpeg failures)
- 1 PROCESSING (might be stuck)

Claude can help you:
1. Fix the FFmpeg issue
2. Retry all 35 error videos
3. Complete your video pipeline

## 🎯 Success Criteria

When Claude fixes this, you should be able to:
1. Create a video with narration
2. See it complete without errors
3. Download the final MP4 with voice
4. Retry all 35 failed videos successfully

## 📞 Next Steps

1. **Push to GitHub** (see commands above)
2. **Copy the "What to Tell Claude" section**
3. **Start a new conversation with Claude**
4. **Share your GitHub repo URL**
5. **Let Claude fix the FFmpeg issue**

## 💰 Cost Note

You mentioned wasting money on 35 failed videos. Make sure to:
1. Document the issue with Abacus.AI support
2. Request credit review for failed attempts
3. Show them this handoff document as proof

---

**Good luck with Claude! Your code is safe and ready to fix.** 🚀
