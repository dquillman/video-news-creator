
# Video News Creator v1.3.3

**Status:** ⚠️ Production deployment has TTS/FFmpeg issues (35 error videos)

## Quick Start

### Environment Setup
Create `.env` file:
```bash
DATABASE_URL="postgresql://role_48c75f005:vYdTt3vd10mMMLYrgVakoK10LULh7KJz@db-48c75f005.db003.hosteddb.reai.io:5432/48c75f005?connect_timeout=15"
PEXELS_API_KEY="your_pexels_key"
ABACUSAI_API_KEY="21183abe0805467386fcb91c66b022ec"
```

### Install & Run
```bash
yarn install
yarn prisma generate
yarn dev
```

## Main Issue: FFmpeg Path Resolution

**Error in Production:**
```
/home/ubuntu/video_news_creator/nextjs_space/.next/server/vendor-chunks/ffmpeg: not found
```

**Files to Fix:**
- `lib/tts-generator.ts` (line 59)
- `lib/video-generator.ts` (all ffmpeg commands)
- `next.config.js` (output configuration)

**Current Approach (NOT WORKING):**
```typescript
import ffmpegStatic from "ffmpeg-static";
const FFMPEG_PATH = ffmpegStatic || 'ffmpeg';
```

**Issue:** In production build, `ffmpegStatic` resolves to non-executable path `.next/server/vendor-chunks/ffmpeg`

## Architecture

### Tech Stack
- Next.js 14.2.28
- PostgreSQL + Prisma
- FFmpeg (bundled via ffmpeg-static)
- Python 3.11.6 (gTTS)
- Pexels API

### Features
- AI news research (topics: RVing, Outdoors, US Gov, High-Tech)
- Multi-scene script generation
- Two visual modes: Real Video (Pexels) | AI Images (templates)
- TTS narration with speed/pitch adjustments
- Dark/Light mode
- Workflow persistence (localStorage)

### Database Stats
- 15 successful videos
- 35 error videos (all TTS/FFmpeg failures)
- 1 processing (stuck)

## File Structure

```
video-news-creator/
├── app/
│   ├── api/              # API routes
│   ├── layout.tsx
│   └── page.tsx
├── components/           # React components
├── lib/                  # Core libraries
│   ├── tts-generator.ts  # ❌ BROKEN (FFmpeg path)
│   ├── video-generator.ts # ❌ BROKEN (FFmpeg path)
│   ├── pexels-video-fetcher.ts
│   └── image-generator.ts
├── prisma/
│   └── schema.prisma
├── public/
│   └── ai-images/       # Template images
├── scripts/
│   ├── seed.ts
│   └── clear-stuck-tasks.ts
├── package.json
├── next.config.js
└── .env
```

## Known Issues

### 1. FFmpeg Bundling (CRITICAL)
- `ffmpeg-static` package not bundling correctly
- Production build can't find executable
- 35 videos failed due to this

### 2. Previous Fixes Attempted
- v1.3.0: Two-stage TTS workflow
- v1.3.1: Added ffmpeg-static import
- v1.3.2: System Python path
- v1.3.3: Pyenv Python path ✅ (fixed Python, FFmpeg still broken)

## Debugging

### Check Errors
```bash
# View error videos
NODE_OPTIONS='--require dotenv/config' npx tsx << 'EOF'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const errors = await prisma.video.findMany({ 
  where: { status: 'ERROR' }, 
  take: 5 
});
console.log(errors.map(v => v.errorMessage));
await prisma.$disconnect();
EOF
```

### Clear Stuck Tasks
```bash
yarn tsx scripts/clear-stuck-tasks.ts
```

### Test TTS
```bash
/opt/computersetup/.pyenv/versions/3.11.6/bin/python3 -c "from gtts import gTTS; print('✅ TTS works')"
```

## What Needs Fixing

### Primary Task: FFmpeg Path Resolution

**Potential Solutions:**
1. Use absolute path to system ffmpeg
2. Copy ffmpeg binary to known location during build
3. Fix Next.js standalone build configuration
4. Use different FFmpeg bundling approach

**Test Checklist:**
- [ ] TTS generation works in dev
- [ ] TTS generation works in production
- [ ] Video assembly works with narration
- [ ] Error videos can be retried
- [ ] No path resolution errors

## Deployment

**Current URL:** video-news-creator-ocx3cf.abacusai.app

**Build Command:**
```bash
yarn build
```

**Deploy:**
```bash
# Already deployed - needs fix before redeployment
```

## Documentation

See `HANDOFF_TO_CLAUDE.md` for complete technical details.

## Support

This project was developed using Abacus.AI DeepAgent. Switching to Claude for FFmpeg fix due to multiple failed deployment attempts.

**Cost Impact:** ~35 failed video attempts × credits per video

---

**Version:** v1.3.3  
**Last Update:** 2025-11-14  
**Status:** Ready for Claude review
