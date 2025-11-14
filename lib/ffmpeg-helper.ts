import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { promises as fs } from "fs";

const execAsync = promisify(exec);

/**
 * Resolves the FFmpeg binary path for both development and production environments.
 *
 * In development: Uses ffmpeg-static package
 * In production: Falls back to system ffmpeg or node_modules path
 */
export async function getFFmpegPath(): Promise<string> {
  // Try multiple strategies to find FFmpeg

  // Strategy 1: Try to import ffmpeg-static dynamically
  try {
    const ffmpegStatic = require('ffmpeg-static');
    if (ffmpegStatic && typeof ffmpegStatic === 'string') {
      // Verify the path exists and is executable
      try {
        await fs.access(ffmpegStatic, fs.constants.X_OK);
        console.log(`✓ Using ffmpeg-static: ${ffmpegStatic}`);
        return ffmpegStatic;
      } catch {
        console.log(`ffmpeg-static path exists but not executable: ${ffmpegStatic}`);
      }
    }
  } catch (error) {
    console.log('ffmpeg-static import failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Strategy 2: Try to find ffmpeg in node_modules
  try {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static');
    const { stdout } = await execAsync(`node -p "require.resolve('ffmpeg-static')"`);
    const resolvedPath = stdout.trim();

    if (resolvedPath && resolvedPath !== 'undefined') {
      // The resolved path points to index.js, we need the actual binary
      const binaryPath = require(resolvedPath);
      if (typeof binaryPath === 'string') {
        try {
          await fs.access(binaryPath, fs.constants.X_OK);
          console.log(`✓ Using node_modules ffmpeg: ${binaryPath}`);
          return binaryPath;
        } catch {
          console.log(`node_modules ffmpeg path not executable: ${binaryPath}`);
        }
      }
    }
  } catch (error) {
    console.log('node_modules resolution failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Strategy 3: Check if system FFmpeg is available
  try {
    await execAsync('ffmpeg -version');
    console.log('✓ Using system ffmpeg');
    return 'ffmpeg';
  } catch {
    console.log('System ffmpeg not found in PATH');
  }

  // Strategy 4: Check common installation paths (Linux/Unix)
  const commonPaths = [
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/opt/homebrew/bin/ffmpeg',
  ];

  for (const ffmpegPath of commonPaths) {
    try {
      await fs.access(ffmpegPath, fs.constants.X_OK);
      await execAsync(`"${ffmpegPath}" -version`);
      console.log(`✓ Using ffmpeg from: ${ffmpegPath}`);
      return ffmpegPath;
    } catch {
      // Continue to next path
    }
  }

  // If all strategies fail, throw an error
  throw new Error(
    'FFmpeg not found. Please ensure ffmpeg-static is installed or ffmpeg is available in your system PATH.\n' +
    'Install options:\n' +
    '1. npm install ffmpeg-static (already in package.json)\n' +
    '2. Install system FFmpeg: apt-get install ffmpeg (Ubuntu/Debian) or brew install ffmpeg (macOS)'
  );
}

// Cache the FFmpeg path after first resolution
let cachedFFmpegPath: string | null = null;

/**
 * Gets the cached FFmpeg path or resolves it if not cached.
 */
export async function getCachedFFmpegPath(): Promise<string> {
  if (cachedFFmpegPath === null) {
    cachedFFmpegPath = await getFFmpegPath();
  }
  return cachedFFmpegPath;
}
