
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, RefreshCw, Star, ExternalLink, Calendar, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NewsStory } from "@/lib/types";
import Image from "next/image";

interface NewsResearchProps {
  topic?: string;
  subTopic?: string;
  onNext: (storyId: string) => void;
  onBack: () => void;
  selectedStory?: string;
}

export function NewsResearch({ topic, subTopic, onNext, onBack, selectedStory }: NewsResearchProps) {
  const [newsStories, setNewsStories] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<string>(selectedStory || "");
  const [researchProgress, setResearchProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (topic) {
      fetchNewsStories();
    }
  }, [topic, subTopic]);

  const fetchNewsStories = async () => {
    if (!topic) return;

    setLoading(true);
    setResearchProgress(0);

    try {
      // Start the research process
      const response = await fetch("/api/news/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topicId: topic, 
          subTopicId: subTopic || null,
          forceRefresh: true 
        }),
      });

      if (!response.ok) throw new Error("Failed to start news research");
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
              setResearchProgress(100);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.progress !== undefined) {
                setResearchProgress(parsed.progress);
              }
              if (parsed.message) {
                toast({
                  title: "Research Update",
                  description: parsed.message,
                });
              }
              if (parsed.stories) {
                setNewsStories(parsed.stories);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Stories are already set from the streaming response above (line 87)
      // No need to fetch again - that would return OLD cached stories!

    } catch (error) {
      console.error("Error fetching news:", error);
      toast({
        title: "Research Failed",
        description: "Failed to research news stories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setResearchProgress(100);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRankingColor = (ranking: number) => {
    switch (ranking) {
      case 1: return "bg-red-100 text-red-800 border-red-200";
      case 2: return "bg-orange-100 text-orange-800 border-orange-200";
      case 3: return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 4: return "bg-green-100 text-green-800 border-green-200";
      case 5: return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const canProceed = selectedStoryId && newsStories.some(s => s.id === selectedStoryId);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Research News Stories
        </h2>
        <p className="text-gray-600">
          Discovering and ranking the most relevant news stories for your selected topic.
        </p>
      </div>

      {loading && (
        <div className="mb-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-blue-900">Research in Progress</h3>
              <span className="text-blue-600 text-sm">{researchProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${researchProgress}%` }}
              />
            </div>
            <p className="text-blue-700 text-sm mt-2">
              Analyzing news sources and ranking stories by public interest...
            </p>
          </div>
        </div>
      )}

      {!loading && newsStories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <TrendingUp className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stories Found</h3>
          <p className="text-gray-600 mb-6">
            No recent news stories were found for the selected topic.
          </p>
          <Button onClick={fetchNewsStories} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Different Keywords
          </Button>
        </div>
      )}

      {newsStories.length > 0 && (
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Top News Stories (Ranked by Interest)
            </h3>
            <Button onClick={fetchNewsStories} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4">
            {newsStories
              .sort((a, b) => a.ranking - b.ranking)
              .map((story) => (
                <Card
                  key={story.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedStoryId === story.id
                      ? "ring-2 ring-blue-500 shadow-lg"
                      : "hover:ring-1 hover:ring-gray-300"
                  }`}
                  onClick={() => setSelectedStoryId(story.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {story.imageUrl && (
                        <div className="flex-shrink-0 relative">
                          <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
                            <Image
                              src={story.imageUrl}
                              alt={story.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge className={`${getRankingColor(story.ranking)} border font-medium`}>
                              #{story.ranking}
                            </Badge>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              {story.publishedAt ? formatDate(story.publishedAt.toString()) : "Recent"}
                            </div>
                          </div>
                          {story.url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(story.url!, "_blank");
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 leading-tight">
                            {story.title}
                          </h4>
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                            {story.summary}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500">
                            <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                            <span>High Interest Story</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Topics
        </Button>

        <Button 
          onClick={() => canProceed && onNext(selectedStoryId)}
          disabled={!canProceed}
          className="min-w-[140px]"
        >
          Configure Video
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
