
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight, Clock, Mic, Image as ImageIcon, Video, Sparkles } from "lucide-react";
import { VideoConfig } from "@/lib/types";

interface VideoConfigurationProps {
  onNext: (config: VideoConfig) => void;
  onBack: () => void;
  initialConfig?: VideoConfig | { duration: number; includeImages: boolean; voiceType: "male" | "female"; visualMode: "real-video" | "ai-images" | "ai-video"; };
}

export function VideoConfiguration({ onNext, onBack, initialConfig }: VideoConfigurationProps) {
  const [duration, setDuration] = useState(initialConfig?.duration || 60);
  const [voiceType, setVoiceType] = useState<"male" | "female">(initialConfig?.voiceType || "female");
  const [includeImages, setIncludeImages] = useState(initialConfig?.includeImages ?? true);
  
  // Convert old ai-video mode to real-video for backward compatibility
  const initialMode = initialConfig?.visualMode;
  const defaultMode: "real-video" | "ai-images" = 
    initialMode === "ai-video" ? "real-video" : 
    initialMode === "ai-images" ? "ai-images" : 
    "real-video";
  const [visualMode, setVisualMode] = useState<"real-video" | "ai-images">(defaultMode);

  const durationOptions = [
    { value: 30, label: "30 seconds", description: "Quick news update" },
    { value: 60, label: "1 minute", description: "Standard news segment" },
    { value: 120, label: "2 minutes", description: "Detailed coverage" },
    { value: 180, label: "3 minutes", description: "In-depth analysis" },
  ];

  const handleNext = () => {
    const config: VideoConfig = {
      duration,
      voiceType,
      includeImages,
      visualMode,
    };
    onNext(config);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Configure Your Video
        </h2>
        <p className="text-gray-600">
          Set the video length, voice style, and visual preferences for your news video.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Duration Selection */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Video Duration
            </CardTitle>
            <CardDescription>
              Choose how long you want your video to be
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Duration Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Duration: {formatDuration(duration)}</Label>
                <span className="text-sm text-gray-500">Max 3 minutes</span>
              </div>
              <Slider
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
                max={180}
                min={30}
                step={30}
                className="w-full"
              />
            </div>

            {/* Quick Duration Options */}
            <div className="grid grid-cols-2 gap-3">
              {durationOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={duration === option.value ? "default" : "outline"}
                  onClick={() => setDuration(option.value)}
                  className="h-auto p-3 text-left"
                >
                  <div>
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs opacity-70">{option.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Voice and Visual Options */}
        <div className="space-y-6">
          {/* Voice Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Mic className="w-5 h-5 mr-2 text-purple-600" />
                Voice Type
              </CardTitle>
              <CardDescription>
                Select the voice style for narration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={voiceType}
                onValueChange={(value: "male" | "female") => setVoiceType(value)}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="cursor-pointer flex-1">
                    <div className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                      <div className="font-medium">Female Voice</div>
                      <div className="text-sm text-gray-500">Professional, clear tone</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="cursor-pointer flex-1">
                    <div className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                      <div className="font-medium">Male Voice</div>
                      <div className="text-sm text-gray-500">Authoritative, deep tone</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Visual Options */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <ImageIcon className="w-5 h-5 mr-2 text-green-600" />
                Visual Content Mode
              </CardTitle>
              <CardDescription>
                Choose between AI-generated images or real video footage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={visualMode}
                onValueChange={(value: "real-video" | "ai-images") => setVisualMode(value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="real-video" id="real-video" />
                  <Label htmlFor="real-video" className="cursor-pointer flex-1">
                    <div className="p-3 rounded-lg border border-gray-200 hover:border-green-300 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <Video className="w-4 h-4 text-green-600" />
                        <div className="font-medium">Real Video Footage</div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Professional stock video clips from Pexels with actual places and people
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ai-images" id="ai-images" />
                  <Label htmlFor="ai-images" className="cursor-pointer flex-1">
                    <div className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <ImageIcon className="w-4 h-4 text-purple-600" />
                        <div className="font-medium">AI Images (Still)</div>
                      </div>
                      <div className="text-sm text-gray-500">
                        AI-generated still images with professional templates
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Configuration Preview */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-lg">Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-blue-600 bg-blue-100 p-2 rounded-lg" />
              <div>
                <div className="font-medium text-gray-900">Duration</div>
                <div className="text-sm text-gray-600">{formatDuration(duration)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mic className="w-8 h-8 text-purple-600 bg-purple-100 p-2 rounded-lg" />
              <div>
                <div className="font-medium text-gray-900">Voice</div>
                <div className="text-sm text-gray-600 capitalize">{voiceType} narrator</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {visualMode === "real-video" ? (
                <Video className="w-8 h-8 text-green-600 bg-green-100 p-2 rounded-lg" />
              ) : (
                <ImageIcon className="w-8 h-8 text-purple-600 bg-purple-100 p-2 rounded-lg" />
              )}
              <div>
                <div className="font-medium text-gray-900">Visual Mode</div>
                <div className="text-sm text-gray-600">
                  {visualMode === "real-video" ? "Real Video Footage" : "AI Images (Still)"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Research
        </Button>

        <Button onClick={handleNext} className="min-w-[140px]">
          Generate Script
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
