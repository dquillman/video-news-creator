
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, FileText, RefreshCw, Clock, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VideoConfig } from "@/lib/types";

interface Script {
  id: string;
  title: string;
  content: string;
  duration: number;
}

interface ScriptGenerationProps {
  storyId?: string;
  config?: VideoConfig | { duration: number; includeImages: boolean; voiceType: "male" | "female"; visualMode: "real-video" | "ai-images" | "ai-video"; };
  onNext: (script: Script) => void;
  onBack: () => void;
  existingScript?: Script;
}

export function ScriptGeneration({ 
  storyId, 
  config, 
  onNext, 
  onBack, 
  existingScript 
}: ScriptGenerationProps) {
  const [script, setScript] = useState<Script | null>(existingScript || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [editedContent, setEditedContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (script?.content) {
      setEditedContent(script.content);
      updateWordCount(script.content);
    }
  }, [script]);

  useEffect(() => {
    updateWordCount(editedContent);
  }, [editedContent]);

  const updateWordCount = (content: string) => {
    const words = content.trim().split(/\s+/).length;
    setWordCount(words);
    // Average speaking rate: 150-160 words per minute
    setEstimatedDuration(Math.ceil((words / 155) * 60)); // Convert to seconds
  };

  const generateScript = async () => {
    if (!storyId || !config) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const response = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          duration: config.duration,
          voiceType: config.voiceType,
          includeImages: config.includeImages,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate script");
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
              setGenerationProgress(100);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.progress !== undefined) {
                setGenerationProgress(parsed.progress);
              }
              if (parsed.message) {
                toast({
                  title: "Script Generation",
                  description: parsed.message,
                });
              }
              if (parsed.script) {
                setScript(parsed.script);
                setEditedContent(parsed.script.content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

    } catch (error) {
      console.error("Error generating script:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate script. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(100);
    }
  };

  const regenerateScript = async () => {
    await generateScript();
  };

  const saveEdits = async () => {
    if (!script || !editedContent.trim()) return;

    try {
      const response = await fetch(`/api/scripts/${script.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editedContent,
          duration: estimatedDuration,
        }),
      });

      if (!response.ok) throw new Error("Failed to save script");
      
      const updatedScript = await response.json();
      setScript(updatedScript);
      
      toast({
        title: "Script Updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving script:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save script changes.",
        variant: "destructive",
      });
    }
  };

  const handleNext = () => {
    if (script) {
      const finalScript = {
        ...script,
        content: editedContent,
        duration: estimatedDuration,
      };
      onNext(finalScript);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) {
      return `${seconds}s`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Auto-generate script if none exists
  useEffect(() => {
    if (!script && storyId && config && !isGenerating) {
      generateScript();
    }
  }, [storyId, config]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Generate & Edit Script
        </h2>
        <p className="text-gray-600">
          AI-powered script generation optimized for your video duration and voice settings.
        </p>
      </div>

      {isGenerating && (
        <div className="mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-blue-900">Generating Script</h3>
                <span className="text-blue-600 text-sm">{generationProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className="text-blue-700 text-sm mt-2">
                Creating a {config?.duration}s script optimized for {config?.voiceType} voice...
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {script && (
        <div className="space-y-6 mb-8">
          {/* Script Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <FileText className="w-5 h-5 mr-2 text-green-600" />
                  {script.title}
                </CardTitle>
                <div className="flex items-center space-x-3">
                  <Button 
                    onClick={regenerateScript}
                    variant="outline" 
                    size="sm"
                    disabled={isGenerating}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                    Regenerate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Target Duration</div>
                    <div className="text-sm text-gray-600">{formatDuration(config?.duration || 0)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Word Count</div>
                    <div className="text-sm text-gray-600">{wordCount} words</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Est. Duration</div>
                    <div className="text-sm text-gray-600">{formatDuration(estimatedDuration)}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Badge 
                    variant={
                      Math.abs(estimatedDuration - (config?.duration || 0)) <= 15 
                        ? "default" 
                        : "secondary"
                    }
                  >
                    {Math.abs(estimatedDuration - (config?.duration || 0)) <= 15 
                      ? "Perfect timing" 
                      : estimatedDuration > (config?.duration || 0)
                      ? "Too long"
                      : "Too short"
                    }
                  </Badge>
                </div>
              </div>

              {/* Script Editor */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Script Content</h4>
                  <Button 
                    onClick={saveEdits}
                    variant="outline" 
                    size="sm"
                    disabled={editedContent === script.content}
                  >
                    Save Changes
                  </Button>
                </div>
                
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder="Script content will appear here..."
                  className="min-h-[300px] font-mono text-sm leading-relaxed"
                />
                
                <div className="text-xs text-gray-500">
                  <p>• Edit the script to match your preferred style and tone</p>
                  <p>• Aim for about 155 words per minute for natural pacing</p>
                  <p>• Use clear, conversational language for better TTS results</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Duration Warning */}
          {Math.abs(estimatedDuration - (config?.duration || 0)) > 30 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold mt-0.5">
                    !
                  </div>
                  <div>
                    <h4 className="font-medium text-yellow-900">Duration Mismatch</h4>
                    <p className="text-yellow-800 text-sm mt-1">
                      The script duration ({formatDuration(estimatedDuration)}) differs significantly from 
                      your target ({formatDuration(config?.duration || 0)}). 
                      {estimatedDuration > (config?.duration || 0) 
                        ? " Consider shortening the content." 
                        : " Consider adding more detail."
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!script && !isGenerating && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Script Available</h3>
          <p className="text-gray-600 mb-6">
            Generate a script based on your selected news story and video configuration.
          </p>
          <Button onClick={generateScript} disabled={!storyId || !config}>
            <FileText className="w-4 h-4 mr-2" />
            Generate Script
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Configuration
        </Button>

        <Button 
          onClick={handleNext}
          disabled={!script || !editedContent.trim()}
          className="min-w-[140px]"
        >
          Create Video
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
