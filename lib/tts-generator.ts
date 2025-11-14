
import { promises as fs } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import ffmpegStatic from "ffmpeg-static";

const execAsync = promisify(exec);

// Get the bundled ffmpeg path (falls back to 'ffmpeg' if not found)
const FFMPEG_PATH = ffmpegStatic || 'ffmpeg';

export async function generateTTS(text: string, voiceType: "male" | "female"): Promise<string> {
  // Clean the text for TTS
  const cleanText = text
    .replace(/\[VISUAL:.*?\]/g, '') // Remove visual cues
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Create temp directory for audio files
  const tempDir = path.join(process.cwd(), 'temp', 'audio');
  await fs.mkdir(tempDir, { recursive: true });

  const timestamp = Date.now();
  const audioFileName = `tts_${timestamp}_${Math.random().toString(36).substr(2, 9)}.wav`;
  const mp3FileName = `tts_${timestamp}_temp.mp3`;
  const audioPath = path.join(tempDir, audioFileName);
  const mp3Path = path.join(tempDir, mp3FileName);

  try {
    // STEP 1: Use Python/gTTS to generate MP3
    const pythonScript = `
import sys
from gtts import gTTS

def generate_mp3(text, output_path):
    try:
        tts = gTTS(text=text, lang='en', slow=False)
        tts.save(output_path)
        print(f"MP3 generated: {output_path}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    text = """${cleanText.replace(/"/g, '\\"')}"""
    output_path = "${mp3Path}"
    generate_mp3(text, output_path)
`;

    const scriptPath = path.join(tempDir, `tts_script_${timestamp}.py`);
    await fs.writeFile(scriptPath, pythonScript);

    // Execute Python script to generate MP3
    console.log('Step 1: Generating MP3 with gTTS...');
    // Use the actual pyenv Python binary (not shims) which has all required packages
    const pythonPath = '/opt/computersetup/.pyenv/versions/3.11.6/bin/python3';
    const { stdout: pyStdout, stderr: pyStderr } = await execAsync(`${pythonPath} "${scriptPath}"`);
    
    if (pyStderr && !pyStderr.includes('UserWarning')) {
      console.error('Python stderr:', pyStderr);
    }
    console.log('Python stdout:', pyStdout);

    // Clean up Python script
    await fs.unlink(scriptPath);

    // Verify MP3 was created
    await fs.access(mp3Path);
    const mp3Stats = await fs.stat(mp3Path);
    if (mp3Stats.size === 0) {
      throw new Error('Generated MP3 file is empty');
    }
    console.log(`MP3 created successfully: ${mp3Stats.size} bytes`);

    // STEP 2: Use Node.js/FFmpeg to convert MP3 to WAV with adjustments
    console.log('Step 2: Converting MP3 to WAV with ffmpeg...');
    
    let ffmpegFilter: string;
    if (voiceType === 'male') {
      // Male: speed up 15% + lower pitch slightly
      ffmpegFilter = 'atempo=1.15,asetrate=44100*0.95,aresample=44100';
    } else {
      // Female: speed up 15% + raise pitch slightly
      ffmpegFilter = 'atempo=1.15,asetrate=44100*1.05,aresample=44100';
    }

    const ffmpegCommand = `"${FFMPEG_PATH}" -y -i "${mp3Path}" -af "${ffmpegFilter}" -ar 44100 -ac 2 "${audioPath}"`;
    
    const { stdout: ffStdout, stderr: ffStderr } = await execAsync(ffmpegCommand, {
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    
    console.log('FFmpeg conversion completed');
    if (ffStderr) {
      // FFmpeg outputs to stderr even on success, so just log it
      console.log('FFmpeg stderr:', ffStderr.substring(0, 200));
    }

    // Clean up temporary MP3
    await fs.unlink(mp3Path);

    // Verify the final WAV file was created
    await fs.access(audioPath);
    const wavStats = await fs.stat(audioPath);
    if (wavStats.size === 0) {
      throw new Error('Generated WAV file is empty');
    }
    
    console.log(`✓ TTS audio generated successfully: ${audioPath} (${wavStats.size} bytes)`);
    return audioPath;

  } catch (error) {
    console.error('Error in TTS generation:', error);
    
    // Clean up any temp files
    try {
      await fs.unlink(mp3Path).catch(() => {});
    } catch {}
    
    // Fallback: Create a simple text file as placeholder if TTS fails
    const fallbackPath = path.join(tempDir, `fallback_${Date.now()}.txt`);
    await fs.writeFile(fallbackPath, `TTS generation failed for: ${cleanText}`);
    
    throw new Error(`TTS generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
