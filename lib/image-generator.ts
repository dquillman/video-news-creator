import { promises as fs } from "fs";
import path from "path";
import { ScriptScene } from "./types";
import { exec } from "child_process";
import { promisify } from "util";
import https from "https";

const execAsync = promisify(exec);

interface GeneratedImage {
  scenePath: string;
  sceneNumber: number;
}

/**
 * Downloads an image from a URL to a local file
 */
async function downloadImage(url: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = require('fs').createWriteStream(filePath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      require('fs').unlink(filePath, () => {});
      reject(err);
    });
  });
}

/**
 * Generates professional AI-style images using pre-generated templates
 * Similar to Ukraine video quality
 */
export async function generateSceneImages(scenes: ScriptScene[]): Promise<GeneratedImage[]> {
  const tempDir = path.join(process.cwd(), 'temp', 'images');
  await fs.mkdir(tempDir, { recursive: true });

  const generatedImages: GeneratedImage[] = [];
  
  // Map of AI image templates based on scene content
  const imageTemplates = {
    military: path.join(process.cwd(), 'public', 'ai-images', 'military.jpg'),
    technology: path.join(process.cwd(), 'public', 'ai-images', 'technology.jpg'),
    nature: path.join(process.cwd(), 'public', 'ai-images', 'nature.jpg'),
    government: path.join(process.cwd(), 'public', 'ai-images', 'government.jpg'),
    science: path.join(process.cwd(), 'public', 'ai-images', 'science.jpg'),
    generic: path.join(process.cwd(), 'public', 'ai-images', 'generic.jpg'),
  };
  
  console.log(`Generating ${scenes.length} professional AI images...`);
  
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    
    try {
      // Select appropriate template based on scene description
      const description = scene.visualDescription.toLowerCase();
      let templatePath = imageTemplates.generic;
      
      if (description.includes('military') || description.includes('defense') || description.includes('war') || description.includes('troop')) {
        templatePath = imageTemplates.military;
      } else if (description.includes('technology') || description.includes('computer') || description.includes('digital') || description.includes('quantum')) {
        templatePath = imageTemplates.technology;
      } else if (description.includes('nature') || description.includes('environment') || description.includes('forest') || description.includes('wildlife')) {
        templatePath = imageTemplates.nature;
      } else if (description.includes('government') || description.includes('congress') || description.includes('politics') || description.includes('legislation')) {
        templatePath = imageTemplates.government;
      } else if (description.includes('science') || description.includes('research') || description.includes('laboratory') || description.includes('discovery')) {
        templatePath = imageTemplates.science;
      }
      
      // Create output with text overlay (similar to Ukraine video)
      const sceneImagePath = path.join(tempDir, `ai_scene_${scene.sceneNumber}_${Date.now()}.jpg`);
      
      // Extract key text from narration (first 60 chars for better display)
      const narrationText = scene.narration
        .substring(0, 60)
        .replace(/'/g, "'")
        .replace(/"/g, '')
        .replace(/\\/g, '')
        .replace(/[^\x20-\x7E]/g, ''); // Remove non-ASCII chars
      
      // Simplified FFmpeg command - just copy the image template without text overlay
      // Text overlays can cause encoding issues, so we'll use clean images
      const command = `ffmpeg -y -i "${templatePath}" ` +
        `-vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720" ` +
        `-q:v 2 -update 1 "${sceneImagePath}"`;
      
      await execAsync(command);
      
      generatedImages.push({
        scenePath: sceneImagePath,
        sceneNumber: scene.sceneNumber,
      });
      
      console.log(`✓ Generated professional AI image for scene ${scene.sceneNumber} using ${path.basename(templatePath)}`);
      
    } catch (error) {
      console.error(`Error generating image for scene ${scene.sceneNumber}:`, error);
      throw new Error(`Failed to generate image for scene ${scene.sceneNumber}`);
    }
  }

  if (generatedImages.length === 0) {
    throw new Error('Failed to generate any scene images');
  }

  console.log(`Successfully generated ${generatedImages.length} professional AI images`);
  return generatedImages;
}