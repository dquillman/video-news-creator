
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, FileText, Video, Newspaper } from "lucide-react";
import { toast } from "sonner";

interface RecoveryItem {
  id: string;
  title: string;
  type: "script" | "video" | "story";
  status?: string;
  createdAt: string;
}

export function RecoveryPanel() {
  const [items, setItems] = useState<RecoveryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecoveryData();
  }, []);

  const loadRecoveryData = async () => {
    try {
      // Load scripts
      const scriptsRes = await fetch("/api/scripts");
      const scriptsData = await scriptsRes.json();
      const scripts = Array.isArray(scriptsData) ? scriptsData : [];
      
      // Load videos
      const videosRes = await fetch("/api/videos");
      const videosData = await videosRes.json();
      const videos = Array.isArray(videosData) ? videosData : [];
      
      // Load stories
      const storiesRes = await fetch("/api/news/stories");
      const storiesData = await storiesRes.json();
      const stories = Array.isArray(storiesData) ? storiesData : [];

      const allItems: RecoveryItem[] = [
        ...scripts.map((s: any) => ({
          id: s.id,
          title: s.title,
          type: "script" as const,
          createdAt: s.createdAt,
        })),
        ...videos.map((v: any) => ({
          id: v.id,
          title: v.title,
          type: "video" as const,
          status: v.status,
          createdAt: v.createdAt,
        })),
        ...stories.slice(0, 5).map((s: any) => ({
          id: s.id,
          title: s.title,
          type: "story" as const,
          createdAt: s.createdAt,
        })),
      ];

      // Sort by date, most recent first
      allItems.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setItems(allItems);
    } catch (error) {
      console.error("Failed to load recovery data:", error);
      toast.error("Failed to load recovery data");
    } finally {
      setLoading(false);
    }
  };

  const continueWithScript = (scriptId: string) => {
    // Save to localStorage for workflow to pick up
    const workflowData = {
      step: "create",
      data: {
        script: { id: scriptId },
      },
    };
    localStorage.setItem("video_news_workflow", JSON.stringify(workflowData));
    toast.success("Script loaded! Redirecting to video creation...");
    window.location.reload();
  };

  const retryVideo = async (videoId: string) => {
    try {
      toast.loading("Retrying video creation...", { id: "retry-video" });
      
      // Fetch the video details to get the script ID
      const videoRes = await fetch(`/api/videos/${videoId}`);
      if (!videoRes.ok) {
        throw new Error("Failed to fetch video details");
      }
      const videoData = await videoRes.json();
      
      // Update video status to processing
      await fetch(`/api/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PROCESSING", errorMessage: null }),
      });
      
      // Trigger video creation with existing script
      const createRes = await fetch("/api/videos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId: videoData.scriptId,
          videoId: videoId,
          duration: videoData.duration,
          voiceType: videoData.voiceType,
          includeImages: videoData.includeImages,
        }),
      });
      
      if (!createRes.ok) {
        const reader = createRes.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let lastMessage = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  lastMessage = data.message || lastMessage;
                  if (data.error) {
                    throw new Error(data.error);
                  }
                } catch (e) {
                  console.error("Parse error:", e);
                }
              }
            }
          }
        }
        throw new Error("Video creation failed");
      }
      
      toast.success("Video creation started! Check Video Library for progress.", { id: "retry-video" });
      
      // Reload after a short delay
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error("Retry error:", error);
      toast.error("Failed to retry video. Please try again.", { id: "retry-video" });
    }
  };

  const useStory = (storyId: string, title: string) => {
    const workflowData = {
      step: "configure",
      data: {
        selectedStory: storyId,
      },
    };
    localStorage.setItem("video_news_workflow", JSON.stringify(workflowData));
    toast.success(`Story "${title}" loaded!`);
    window.location.reload();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading recovery data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            No Recovery Needed
          </CardTitle>
          <CardDescription>
            No previous work found. Start fresh with the workflow above!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          Recovery Mode
        </CardTitle>
        <CardDescription>
          Found {items.length} items from your previous session. Click to continue where you left off.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start gap-3 flex-1">
              {item.type === "script" && (
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              )}
              {item.type === "video" && (
                <Video className="w-5 h-5 text-purple-600 mt-0.5" />
              )}
              {item.type === "story" && (
                <Newspaper className="w-5 h-5 text-green-600 mt-0.5" />
              )}
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {item.type.toUpperCase()}
                  </Badge>
                  {item.status && (
                    <Badge
                      variant={item.status === "COMPLETED" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {item.status}
                    </Badge>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {item.type === "script" && (
                <Button
                  size="sm"
                  onClick={() => continueWithScript(item.id)}
                >
                  Continue
                </Button>
              )}
              {item.type === "video" && item.status === "ERROR" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => retryVideo(item.id)}
                >
                  Retry
                </Button>
              )}
              {item.type === "story" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => useStory(item.id, item.title)}
                >
                  Use Story
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
