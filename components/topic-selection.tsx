
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Plus, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Topic {
  id: string;
  name: string;
  description: string;
  subTopics: SubTopic[];
}

interface SubTopic {
  id: string;
  name: string;
  description: string;
}

interface TopicSelectionProps {
  onNext: (topicId: string, subTopicId?: string) => void;
  selectedTopic?: string;
  selectedSubTopic?: string;
}

export function TopicSelection({ onNext, selectedTopic, selectedSubTopic }: TopicSelectionProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>(selectedTopic || "");
  const [currentSubTopic, setCurrentSubTopic] = useState<string>(selectedSubTopic || "");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await fetch("/api/topics");
      if (!response.ok) throw new Error("Failed to fetch topics");
      const data = await response.json();
      setTopics(data);
    } catch (error) {
      console.error("Error fetching topics:", error);
      toast({
        title: "Error",
        description: "Failed to load topics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedTopicData = topics.find(t => t.id === currentTopic);
  const canProceed = currentTopic && (selectedTopicData?.subTopics?.length === 0 || currentSubTopic);

  const handleNext = () => {
    if (canProceed) {
      console.log('🎯 TOPIC SELECTION:', {
        topicId: currentTopic,
        topicName: selectedTopicData?.name,
        subTopicId: currentSubTopic || 'NONE',
        subTopicName: selectedTopicData?.subTopics?.find(st => st.id === currentSubTopic)?.name || 'NONE',
        timestamp: new Date().toISOString()
      });
      onNext(currentTopic, currentSubTopic || undefined);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">
          Select News Topic
        </h2>
        <p className="text-muted-foreground">
          Choose the main topic and category for your news video content.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Topic Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Main Topics</h3>
          <div className="grid gap-3">
            {topics.map((topic) => (
              <Card
                key={topic.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  currentTopic === topic.id
                    ? "ring-2 ring-blue-500 shadow-md"
                    : "hover:ring-1 hover:ring-gray-300"
                }`}
                onClick={() => {
                  setCurrentTopic(topic.id);
                  setCurrentSubTopic("");
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{topic.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                    </div>
                    <Badge variant="outline">
                      {topic.subTopics?.length || 0} sub-topics
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              const topicName = prompt("Enter new topic name:");
              if (topicName?.trim()) {
                const description = prompt("Enter topic description (optional):");
                // Here you would typically call an API to create the topic
                alert(`Custom topic "${topicName}" will be added in a future update.\n\nFor now, please use the existing topics or contact support to add new topics.`);
              }
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Topic
          </Button>
        </div>

        {/* SubTopic Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Sub-Categories
            {selectedTopicData && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                for {selectedTopicData.name}
              </span>
            )}
          </h3>

          {selectedTopicData ? (
            selectedTopicData.subTopics?.length > 0 ? (
              <div className="space-y-2">
                <Select value={currentSubTopic} onValueChange={setCurrentSubTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sub-category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTopicData.subTopics.map((subTopic) => (
                      <SelectItem key={subTopic.id} value={subTopic.id}>
                        <div>
                          <div className="font-medium">{subTopic.name}</div>
                          <div className="text-xs text-muted-foreground">{subTopic.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {currentSubTopic && (
                  <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg border border-blue-500/20">
                    <div className="text-sm font-medium">
                      {selectedTopicData.subTopics.find(st => st.id === currentSubTopic)?.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {selectedTopicData.subTopics.find(st => st.id === currentSubTopic)?.description}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-muted-foreground">No sub-categories available for this topic.</p>
              </div>
            )
          ) : (
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-muted-foreground">Select a main topic first to see sub-categories.</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button 
          variant="outline"
          onClick={() => {
            alert("Topic Management Panel\n\nCurrent topics:\n• RVing (4 sub-topics)\n• Outdoors (5 sub-topics)\n• US Government (5 sub-topics)\n• High-Tech (5 sub-topics)\n\nFull topic management interface coming in a future update!");
          }}
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Manage Topics
        </Button>

        <Button 
          onClick={handleNext}
          disabled={!canProceed}
          className="min-w-[140px]"
        >
          Research News
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
