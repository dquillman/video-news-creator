
export interface Topic {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  subTopics?: SubTopic[];
  newsStories?: NewsStory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SubTopic {
  id: string;
  name: string;
  description?: string;
  topicId: string;
  isActive: boolean;
  topic?: Topic;
  newsStories?: NewsStory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsStory {
  id: string;
  title: string;
  summary: string;
  content: string;
  url?: string;
  imageUrl?: string;
  ranking: number; // 1-5 where 1 is highest interest
  topicId: string;
  subTopicId?: string;
  publishedAt?: Date;
  topic?: Topic;
  subTopic?: SubTopic;
  scripts?: Script[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScriptScene {
  sceneNumber: number;
  narration: string;
  visualDescription: string;
  duration: number; // in seconds
}

export interface Script {
  id: string;
  title: string;
  content: string;
  scenes?: ScriptScene[]; // Structured scenes for video generation
  duration: number; // in seconds
  newsStoryId: string;
  newsStory?: NewsStory;
  videos?: Video[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  duration: number; // requested duration in seconds
  actualDuration?: number; // actual generated duration
  voiceType: "male" | "female";
  includeImages: boolean;
  status: VideoStatus;
  filePath?: string;
  fileSize?: string;
  downloadUrl?: string;
  scriptId: string;
  script?: Script;
  errorMessage?: string;
  processingLog?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export enum VideoStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
  EXPIRED = "EXPIRED",
}

export interface UserPreferences {
  id: string;
  defaultDuration: number;
  defaultVoiceType: "male" | "female";
  includeImages: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoConfig {
  duration: number;
  includeImages: boolean;
  voiceType: "male" | "female";
  visualMode: "real-video" | "ai-images"; // Real video (Pexels) or AI images (still)
}

export interface NewsAPIResponse {
  articles: {
    title: string;
    description: string;
    content: string;
    url: string;
    urlToImage: string;
    publishedAt: string;
    source: {
      name: string;
    };
  }[];
  totalResults: number;
  status: string;
}

export interface LLMResponse {
  newsStories: {
    title: string;
    summary: string;
    content: string;
    ranking: number;
    imageUrl?: string;
  }[];
}

export interface ScriptGenerationRequest {
  newsStoryId: string;
  duration: number; // in seconds
  voiceType: "male" | "female";
  includeImages: boolean;
}

export interface VideoGenerationProgress {
  stage: "preparing" | "tts" | "images" | "video" | "completed" | "error";
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // in seconds
}
