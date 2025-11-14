
import { promises as fs } from "fs";
import path from "path";
import { ScriptScene } from "./types";

export interface GeneratedVideoClip {
  videoPath: string;
  sceneNumber: number;
  duration: number;
}

/**
 * Creates a video generation prompt from scene description
 */
export function createVideoPrompt(scene: ScriptScene): string {
  const visualDesc = scene.visualDescription || scene.narration;
  
  // Enhanced prompt with motion and camera movement keywords
  return `${visualDesc}, cinematic camera movement with smooth motion, photorealistic with high detail, dramatic lighting and atmospheric depth, fluid animation`;
}

/**
 * IMPORTANT: AI video generation via API is NOT supported
 * This function throws an error to guide users to use Real Video mode instead
 */
export async function generateAIVideoClips(scenes: ScriptScene[]): Promise<GeneratedVideoClip[]> {
  throw new Error(
    'AI Video generation is currently not available. Please use "Real Video" mode for motion video content with professional stock footage from Pexels.'
  );
}
