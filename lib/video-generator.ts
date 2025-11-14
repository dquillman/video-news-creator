
import { promises as fs } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { ScriptScene } from "./types";
import { getCachedFFmpegPath } from "./ffmpeg-helper";

const execAsync = promisify(exec);

interface SceneAudio {
  audioPath: string;
  duration: number;
}

interface VideoGenerationOptions {
  audioPath: string;
  sceneAudioPaths?: SceneAudio[]; // For scene-based videos
  imagePaths: string[];
  sceneImages?: { scenePath: string; sceneNumber: number }[]; // For scene-based videos (static images)
  sceneVideos?: { videoPath: string; sceneNumber: number; duration: number }[]; // For scene-based videos (real footage)
  title: string;
  duration: number;
  includeImages: boolean;
  scenes?: ScriptScene[]; // Scene information
}

interface VideoResult {
  videoPath: string;
  actualDuration: number;
  fileSize: number;
}

export async function generateVideo(options: VideoGenerationOptions): Promise<VideoResult> {
  const { audioPath, sceneImages, sceneVideos, title, duration, includeImages, scenes } = options;

  // Create temp directory for video files
  const tempDir = path.join(process.cwd(), 'temp', 'videos');
  await fs.mkdir(tempDir, { recursive: true });

  const videoFileName = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`;
  const videoPath = path.join(tempDir, videoFileName);

  // Get FFmpeg path dynamically at runtime
  const FFMPEG_PATH = await getCachedFFmpegPath();

  try {
    // Check if ffmpeg is available
    try {
      await execAsync(`"${FFMPEG_PATH}" -version`);
    } catch {
      throw new Error('FFmpeg is not installed or not available in PATH');
    }

    let ffmpegCommand: string;

    // Prioritize real video clips if available
    if (sceneVideos && sceneVideos.length > 0 && scenes && scenes.length > 0) {
      console.log(`Generating video with ${sceneVideos.length} real video clips`);
      console.log('Scene durations:', scenes.map((s, i) => `Scene ${i+1}: ${s.duration}s`).join(', '));
      
      // SIMPLIFIED APPROACH: Process videos individually, then concatenate
      // This is more reliable than complex filter_complex chains
      
      const processedClips: string[] = [];
      
      for (let i = 0; i < sceneVideos.length; i++) {
        const vid = sceneVideos[i];
        const scene = scenes[i];
        const sceneDuration = scene.duration || (duration / scenes.length);
        const processedPath = path.join(tempDir, `processed_${i}_${Date.now()}.mp4`);
        
        console.log(`Processing clip ${i+1}/${sceneVideos.length}: ${vid.videoPath}`);
        console.log(`Target duration: ${sceneDuration}s, Source duration: ${vid.duration}s`);
        
        try {
          // Simple, reliable processing for each clip
          const clipCommand = `"${FFMPEG_PATH}" -y -i "${vid.videoPath}" ` +
            `-t ${sceneDuration} ` + // Trim to scene duration
            `-vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" ` +
            `-c:v libx264 -preset ultrafast -crf 23 ` + // Use ultrafast preset for speed
            `-an ` + // Remove audio from clips
            `"${processedPath}"`;
          
          console.log(`Executing: ${clipCommand.substring(0, 100)}...`);
          
          const { stdout, stderr } = await execAsync(clipCommand, {
            timeout: 120000, // 2 minute timeout per clip
            maxBuffer: 5 * 1024 * 1024,
          });
          
          if (stderr && stderr.includes('error')) {
            console.error(`FFmpeg stderr for clip ${i}:`, stderr.substring(0, 200));
          }
          
          // Verify clip was created
          const clipStats = await fs.stat(processedPath);
          if (clipStats.size === 0) {
            throw new Error(`Processed clip ${i} is empty`);
          }
          
          processedClips.push(processedPath);
          console.log(`✓ Processed clip ${i+1}, size: ${(clipStats.size / 1024 / 1024).toFixed(2)}MB`);
          
        } catch (error) {
          console.error(`Error processing clip ${i}:`, error);
          throw new Error(`Failed to process video clip ${i+1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Create concat file for FFmpeg
      const concatFilePath = path.join(tempDir, `concat_${Date.now()}.txt`);
      const concatContent = processedClips.map(p => `file '${p}'`).join('\n');
      await fs.writeFile(concatFilePath, concatContent);
      
      console.log('Concatenating clips and adding audio...');
      
      // Simple concatenation with audio overlay
      ffmpegCommand = `"${FFMPEG_PATH}" -y -f concat -safe 0 -i "${concatFilePath}" -i "${audioPath}" ` +
        `-c:v copy ` + // Copy video (no re-encoding)
        `-c:a aac -b:a 192k ` + // Encode audio
        `-shortest "${videoPath}"`;
        
    } else if (sceneImages && sceneImages.length > 0 && scenes && scenes.length > 0) {
      console.log(`Generating scene-based video with ${sceneImages.length} scenes`);
      
      // Calculate duration per scene based on audio duration
      const sceneDurations = scenes.map(s => s.duration);
      
      // Build input files
      const imageInputs = sceneImages.map(img => `-loop 1 -i "${img.scenePath}"`).join(' ');
      
      // Build filter complex for scene transitions
      const sceneFilters: string[] = [];
      const fadeInDuration = 0.5;
      const fadeOutDuration = 0.5;
      
      sceneImages.forEach((img, index) => {
        const sceneDuration = sceneDurations[index] || (duration / scenes.length);
        
        // Scale and pad each scene, then add fade in/out
        sceneFilters.push(
          `[${index}:v]scale=1280:720:force_original_aspect_ratio=decrease,` +
          `pad=1280:720:(ow-iw)/2:(oh-ih)/2,` +
          `setpts=PTS-STARTPTS,` +
          `trim=duration=${sceneDuration},` +
          `fade=t=in:st=0:d=${fadeInDuration},` +
          `fade=t=out:st=${sceneDuration - fadeOutDuration}:d=${fadeOutDuration}` +
          `[v${index}]`
        );
      });
      
      // Concatenate all scenes
      const concatInputs = sceneImages.map((_, i) => `[v${i}]`).join('');
      const filterComplex = sceneFilters.join(';') + 
        `;${concatInputs}concat=n=${sceneImages.length}:v=1:a=0[outv]`;
      
      // Combine video with audio
      ffmpegCommand = `"${FFMPEG_PATH}" -y ${imageInputs} -i "${audioPath}" ` +
        `-filter_complex "${filterComplex}" ` +
        `-map "[outv]" -map ${sceneImages.length}:a ` +
        `-c:v libx264 -preset medium -crf 23 -c:a aac -b:a 192k ` +
        `-pix_fmt yuv420p -shortest "${videoPath}"`;
        
    } else {
      // Fallback to single background video (backward compatibility)
      const bgImagePath = path.join(tempDir, `bg_${Date.now()}.png`);
      
      const bgCommand = `"${FFMPEG_PATH}" -y -f lavfi -i "color=c=0x1e40af:size=1280x720:duration=1" ` +
        `-vf "drawtext=text='${title.replace(/'/g, "\\'")}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" ` +
        `-frames:v 1 -update 1 "${bgImagePath}"`;
      
      try {
        await execAsync(bgCommand);
      } catch {
        // Fallback: create simple solid color background
        await execAsync(`"${FFMPEG_PATH}" -y -f lavfi -i "color=c=0x1e40af:size=1280x720:duration=1" -frames:v 1 -update 1 "${bgImagePath}"`);
      }

      ffmpegCommand = `"${FFMPEG_PATH}" -y -loop 1 -i "${bgImagePath}" -i "${audioPath}" ` +
        `-c:v libx264 -tune stillimage -c:a aac -b:a 192k ` +
        `-pix_fmt yuv420p -shortest "${videoPath}"`;
    }

    console.log('Generating video with command:', ffmpegCommand);
    
    // Execute ffmpeg command with increased timeout for complex videos
    const { stdout, stderr } = await execAsync(ffmpegCommand, {
      timeout: 600000, // 10 minute timeout (increased from 5 minutes)
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for stdout/stderr
    });

    console.log('FFmpeg stdout:', stdout);
    if (stderr) {
      console.log('FFmpeg stderr:', stderr);
    }

    // Verify the video file was created
    let stats;
    try {
      stats = await fs.stat(videoPath);
      if (stats.size === 0) {
        throw new Error('Generated video file is empty');
      }
    } catch {
      throw new Error('Failed to generate video file');
    }

    // Get actual video duration using ffprobe
    let actualDuration = duration;
    try {
      const { stdout: probeOutput } = await execAsync(
        `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${videoPath}"`
      );
      actualDuration = Math.round(parseFloat(probeOutput.trim()));
    } catch (error) {
      console.error('Error getting video duration:', error);
      // Use original duration as fallback
    }

    return {
      videoPath,
      actualDuration,
      fileSize: stats.size,
    };

  } catch (error) {
    console.error('Error in video generation:', error);
    
    // Clean up any partial files
    try {
      await fs.unlink(videoPath);
    } catch {
      // Ignore cleanup errors
    }
    
    throw new Error(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
