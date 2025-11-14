
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Play, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VideoConfig } from "@/lib/types";

interface Script {
  id: string;
  title: string;
  content: string;
  duration: number;
}

interface VideoCreationProps {
  script?: Script;
  config?: VideoConfig | { duration: number; includeImages: boolean; voiceType: "male" | "female"; visualMode: "real-video" | "ai-images" | "ai-video"; };
  onComplete: () => void;
  onBack: () => void;
}

interface VideoProgress {
  stage: "preparing" | "tts" | "images" | "video" | "completed" | "error";
  progress: number;
  message: string;
  estimatedTimeRemaining?: number;
  videoId?: string;
  downloadUrl?: string;
  error?: string;
}

export function VideoCreation({ script, config, onComplete, onBack }: VideoCreationProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const { toast } = useToast();

  const createVideo = async () => {
    if (!script || !config) return;

    setIsCreating(true);
    setProgress({ stage: "preparing", progress: 0, message: "Initializing video creation..." });

    try {
      const response = await fetch("/api/videos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId: script.id,
          duration: config.duration,
          voiceType: config.voiceType,
          includeImages: config.includeImages,
          visualMode: config.visualMode || "real-video", // Default to real-video for backward compatibility
        }),
      });

      if (!response.ok) throw new Error("Failed to start video creation");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            
            try {
              const parsed = JSON.parse(data) as VideoProgress;
              setProgress(parsed);
              
              if (parsed.videoId) {
                setVideoId(parsed.videoId);
              }
              
              if (parsed.stage === "completed" && parsed.downloadUrl) {
                toast({
                  title: "Video Created Successfully!",
                  description: "Your news video is ready for download.",
                });
              }
              
              if (parsed.stage === "error") {
                toast({
                  title: "Video Creation Failed",
                  description: parsed.error || "An unknown error occurred.",
                  variant: "destructive",
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

    } catch (error) {
      console.error("Error creating video:", error);
      setProgress({
        stage: "error",
        progress: 0,
        message: "Video creation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      toast({
        title: "Creation Failed",
        description: "Failed to create video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const downloadVideo = async () => {
    if (!progress?.downloadUrl) return;

    try {
      const link = document.createElement('a');
      link.href = progress.downloadUrl;
      link.download = `${script?.title || 'news-video'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Your video download has begun.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStageIcon = (stage: VideoProgress["stage"]) => {
    switch (stage) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-blue-600 animate-pulse" />;
    }
  };

  const getStageLabel = (stage: VideoProgress["stage"]) => {
    switch (stage) {
      case "preparing": return "Preparing";
      case "tts": return "Generating Voice";
      case "images": return "Processing Images";
      case "video": return "Creating Video";
      case "completed": return "Completed";
      case "error": return "Error";
      default: return "Processing";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!script || !config) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Missing Information</h3>
          <p className="text-gray-600 mb-6">
            Script or configuration is missing. Please go back and complete the previous steps.
          </p>
          <Button onClick={onBack} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create Your Video
        </h2>
        <p className="text-gray-600">
          Transform your script into a professional news video with AI-generated narration.
        </p>
      </div>

      {/* Video Configuration Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Video Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-900">Duration</div>
              <div className="text-sm text-gray-600">{formatTime(config.duration)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Voice Type</div>
              <div className="text-sm text-gray-600 capitalize">{config.voiceType}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Visual Mode</div>
              <div className="text-sm text-gray-600">
                {config.visualMode === "real-video" ? "Real Video" : config.visualMode === "ai-images" ? "AI Images" : "Real Video"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Script</div>
              <div className="text-sm text-gray-600">{script.title}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creation Progress */}
      {progress && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                {getStageIcon(progress.stage)}
                <span className="ml-2">Video Creation Progress</span>
              </CardTitle>
              <Badge 
                variant={
                  progress.stage === "completed" ? "default" :
                  progress.stage === "error" ? "destructive" : "secondary"
                }
              >
                {getStageLabel(progress.stage)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2 gap-4">
                <span className="text-sm font-medium break-words flex-1">{progress.message}</span>
                <span className="text-sm text-gray-500 flex-shrink-0">{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-3" />
            </div>

            {progress.estimatedTimeRemaining && progress.stage !== "completed" && (
              <div className="text-sm text-gray-600">
                Estimated time remaining: {formatTime(progress.estimatedTimeRemaining)}
              </div>
            )}

            {progress.stage === "error" && progress.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg overflow-hidden">
                <div className="text-red-800 text-sm break-words">
                  <strong>Error:</strong> {progress.error}
                </div>
              </div>
            )}

            {progress.stage === "completed" && progress.downloadUrl && (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <div className="text-green-800 font-medium">Video Created Successfully!</div>
                  <div className="text-green-700 text-sm">Your news video is ready for download.</div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button onClick={downloadVideo} size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(progress.downloadUrl, '_blank')}>
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Creation Control */}
      {!progress && (
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="text-lg">Ready to Create Video</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-gray-600 mb-6">
              Everything is configured and ready. Click the button below to start creating your professional news video.
            </p>
            <Button onClick={createVideo} disabled={isCreating} size="lg">
              <Play className="w-5 h-5 mr-2" />
              {isCreating ? "Creating Video..." : "Create Video"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button variant="outline" onClick={onBack} disabled={isCreating}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Script
        </Button>

        <Button 
          onClick={onComplete}
          disabled={progress?.stage !== "completed"}
          className="min-w-[140px]"
        >
          View Library
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
