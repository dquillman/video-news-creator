
import { promises as fs } from "fs";
import path from "path";
import { ScriptScene } from "./types";

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  video_files: {
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }[];
}

interface PexelsSearchResponse {
  videos: PexelsVideo[];
  page: number;
  per_page: number;
  total_results: number;
}

interface DownloadedVideo {
  videoPath: string;
  sceneNumber: number;
  duration: number;
}

export async function fetchPexelsVideos(
  scenes: ScriptScene[], 
  topicContext?: { topic: string; subTopic?: string }
): Promise<DownloadedVideo[]> {
  const tempDir = path.join(process.cwd(), 'temp', 'videos');
  await fs.mkdir(tempDir, { recursive: true });

  // Read API key from secrets file
  const homeDir = process.env.HOME || '/home/ubuntu';
  const secretsPath = path.join(homeDir, '.config', 'abacusai_auth_secrets.json');
  let apiKey: string;
  
  try {
    const secretsContent = await fs.readFile(secretsPath, 'utf-8');
    const secrets = JSON.parse(secretsContent);
    apiKey = secrets.pexels?.secrets?.api_key?.value;
    
    if (!apiKey) {
      throw new Error('Pexels API key not found in secrets file');
    }
  } catch (error) {
    console.error('Error reading Pexels API key:', error);
    throw new Error('Failed to read Pexels API key. Please configure it first.');
  }

  const downloadedVideos: DownloadedVideo[] = [];

  console.log(`📋 TOPIC CONTEXT: ${topicContext?.topic || 'None'} > ${topicContext?.subTopic || 'None'}`);

  for (const scene of scenes) {
    try {
      // Extract keywords from visual description for search
      const searchQuery = extractSearchKeywords(scene.visualDescription, topicContext);
      console.log(`🔍 Scene ${scene.sceneNumber}: "${scene.visualDescription.substring(0, 80)}..." → Search: "${searchQuery}"`);

      // Search for videos on Pexels - fetch MORE options (15) to be pickier
      const searchUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(searchQuery)}&per_page=15&orientation=landscape`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      const data: PexelsSearchResponse = await response.json();

      if (!data.videos || data.videos.length === 0) {
        console.warn(`No videos found for scene ${scene.sceneNumber}, using fallback`);
        continue;
      }

      // IMPROVED: Rank videos by quality and relevance
      // Prefer videos that are:
      // 1. HD quality (1280x720 or 1920x1080)
      // 2. Reasonable duration (5-30 seconds)
      // 3. Have good aspect ratio for news video
      const rankedVideos = data.videos
        .map((v) => {
          const hasHD = v.video_files.some(f => f.width >= 1280);
          const durationScore = v.duration >= 5 && v.duration <= 30 ? 2 : 1;
          const qualityScore = hasHD ? 2 : 1;
          return {
            video: v,
            score: durationScore + qualityScore
          };
        })
        .sort((a, b) => b.score - a.score);

      // Get the best-ranked video
      const video = rankedVideos[0].video;
      
      console.log(`✓ Selected video for scene ${scene.sceneNumber}: duration=${video.duration}s, score=${rankedVideos[0].score}`);
      
      // Find the best quality HD video file (1280x720 or similar)
      const videoFile = video.video_files.find(
        f => f.width === 1280 || f.width === 1920
      ) || video.video_files[0];

      if (!videoFile) {
        console.warn(`No suitable video file for scene ${scene.sceneNumber}`);
        continue;
      }

      // Download the video
      const videoPath = path.join(tempDir, `pexels_scene_${scene.sceneNumber}_${Date.now()}.mp4`);
      console.log(`Downloading video for scene ${scene.sceneNumber}...`);

      const videoResponse = await fetch(videoFile.link);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
      }

      const buffer = await videoResponse.arrayBuffer();
      await fs.writeFile(videoPath, Buffer.from(buffer));

      downloadedVideos.push({
        videoPath,
        sceneNumber: scene.sceneNumber,
        duration: video.duration,
      });

      console.log(`✓ Downloaded video for scene ${scene.sceneNumber}`);

      // Add a small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`Error fetching video for scene ${scene.sceneNumber}:`, error);
      // Continue with next scene even if one fails
    }
  }

  return downloadedVideos;
}

function extractSearchKeywords(
  description: string, 
  topicContext?: { topic: string; subTopic?: string }
): string {
  // ULTRA STRICT: Add topic context to EVERY search to prevent irrelevant results
  // This ensures "quantum computing" videos won't show doctors or shoppers
  
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'for', 'with', 'by', 'as', 'is', 'are', 'was', 'were', 'this', 'that', 'these', 'those', 'showing', 'shows', 'show', 'scene', 'visual', 'footage', 'image', 'background', 'people', 'person', 'man', 'woman', 'working'];
  
  // EXPANDED: Domain-specific keywords that MUST be included if present
  const priorityKeywords = [
    // Tech/Computing
    'quantum', 'computing', 'technology', 'computer', 'processor', 'chip', 'algorithm', 'data', 'server', 'circuit', 'electronics', 'semiconductor', 'software', 'hardware', 'code', 'programming',
    // Outdoors/Nature
    'hiking', 'trail', 'mountain', 'nature', 'forest', 'wilderness', 'outdoor', 'camping', 'backpacking', 'scenic', 'landscape', 'peak', 'summit', 'valley',
    // Government/Politics
    'government', 'congress', 'senate', 'capitol', 'president', 'legislation', 'policy', 'political', 'federal', 'washington', 'white house', 'parliament',
    // Military/Defense
    'military', 'defense', 'army', 'navy', 'soldier', 'weapon', 'combat', 'tactical', 'warfare', 'forces', 'troops',
    // Space/Astronomy
    'space', 'rocket', 'satellite', 'nasa', 'telescope', 'astronaut', 'planet', 'mars', 'moon', 'orbit', 'launch', 'spacecraft', 'galaxy', 'star',
    // Science/Research
    'research', 'scientist', 'laboratory', 'experiment', 'innovation', 'discovery', 'scientific', 'study', 'analysis', 'microscope',
    // Business/Economy
    'business', 'economy', 'market', 'finance', 'industry', 'company', 'corporate', 'stock', 'trade', 'investment'
  ];
  
  // CRITICAL: Add topic context as mandatory prefix to ensure relevance
  let topicPrefix = '';
  if (topicContext?.subTopic) {
    topicPrefix = topicContext.subTopic.toLowerCase().replace(/[^a-z\s]/g, ' ').trim();
  } else if (topicContext?.topic) {
    topicPrefix = topicContext.topic.toLowerCase().replace(/[^a-z\s]/g, ' ').trim();
  }
  
  const words = description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));

  // Separate priority and regular keywords
  const priority = words.filter(w => priorityKeywords.includes(w));
  const regular = words.filter(w => !priorityKeywords.includes(w) && w.length > 3);

  // BUILD ULTRA-SPECIFIC QUERY
  let keywords = '';
  
  // ALWAYS start with topic context
  if (topicPrefix) {
    keywords = topicPrefix;
  }
  
  if (priority.length > 0) {
    // Add priority keywords (up to 2)
    const priorityTerms = priority.slice(0, 2).join(' ');
    keywords = keywords ? `${keywords} ${priorityTerms}` : priorityTerms;
    
    // Add 1 contextual word if space allows
    if (regular.length > 0 && keywords.split(' ').length < 5) {
      keywords += ' ' + regular[0];
    }
  } else if (regular.length > 0) {
    // No priority keywords - use topic + 2 best regular words
    const regularTerms = regular.slice(0, 2).join(' ');
    keywords = keywords ? `${keywords} ${regularTerms}` : regularTerms;
  }
  
  // FALLBACK: If still empty, use topic context alone (better than generic description)
  if (!keywords.trim()) {
    keywords = topicPrefix || description.substring(0, 30);
  }
  
  // LIMIT to 5 words max for precision
  const finalQuery = keywords.trim().split(/\s+/).slice(0, 5).join(' ');
  
  return finalQuery;
}
