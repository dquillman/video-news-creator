
"use client";

import { useState, useEffect } from "react";
import { TopicSelection } from "@/components/topic-selection";
import { NewsResearch } from "@/components/news-research";
import { VideoConfiguration } from "@/components/video-configuration";
import { ScriptGeneration } from "@/components/script-generation";
import { VideoCreation } from "@/components/video-creation";
import { VideoLibrary } from "@/components/video-library";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export type WorkflowStep = 
  | "topics" 
  | "research" 
  | "configure" 
  | "script" 
  | "create" 
  | "library";

interface WorkflowData {
  selectedTopic?: string;
  selectedSubTopic?: string;
  selectedStory?: string;
  videoConfig?: {
    duration: number;
    includeImages: boolean;
    voiceType: "male" | "female";
    visualMode: "real-video" | "ai-images" | "ai-video"; // ai-video is deprecated but kept for backward compatibility
  };
  script?: {
    id: string;
    content: string;
    title: string;
    duration: number;
  };
}

const WORKFLOW_STORAGE_KEY = "video_news_workflow";

export function WorkflowContainer() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("topics");
  const [workflowData, setWorkflowData] = useState<WorkflowData>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved workflow state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(WORKFLOW_STORAGE_KEY);
      if (saved) {
        const { step, data } = JSON.parse(saved);
        setCurrentStep(step);
        setWorkflowData(data);
      }
    } catch (error) {
      console.error("Failed to load workflow state:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save workflow state whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(
          WORKFLOW_STORAGE_KEY,
          JSON.stringify({ step: currentStep, data: workflowData })
        );
      } catch (error) {
        console.error("Failed to save workflow state:", error);
      }
    }
  }, [currentStep, workflowData, isLoaded]);

  // Reset workflow and clear saved state
  const resetWorkflow = () => {
    if (confirm("Are you sure you want to start over? This will clear all progress.")) {
      setWorkflowData({});
      setCurrentStep("topics");
      localStorage.removeItem(WORKFLOW_STORAGE_KEY);
    }
  };

  const steps = [
    { id: "topics", label: "Select Topic", icon: "🗂️" },
    { id: "research", label: "Research News", icon: "🔍" },
    { id: "configure", label: "Configure Video", icon: "⚙️" },
    { id: "script", label: "Generate Script", icon: "📝" },
    { id: "create", label: "Create Video", icon: "🎬" },
    { id: "library", label: "Video Library", icon: "📚" },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const updateWorkflowData = (data: Partial<WorkflowData>) => {
    setWorkflowData(prev => ({ ...prev, ...data }));
  };

  const goToStep = (step: WorkflowStep) => {
    setCurrentStep(step);
  };

  // Show loading state while hydrating
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="bg-card rounded-lg p-6 shadow-lg border">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">
              Workflow Progress
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <Button
                onClick={resetWorkflow}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {/* Step Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(step.id as WorkflowStep)}
              className={`p-3 rounded-lg text-center transition-all ${
                step.id === currentStep
                  ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-2 border-blue-500/50"
                  : index <= currentStepIndex
                  ? "bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30"
                  : "bg-muted text-muted-foreground"
              }`}
              disabled={index > currentStepIndex + 1}
            >
              <div className="text-2xl mb-1">{step.icon}</div>
              <div className="text-xs font-medium">{step.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-card rounded-lg shadow-lg overflow-hidden border">
        {currentStep === "topics" && (
          <TopicSelection
            onNext={(topic, subTopic) => {
              // CRITICAL FIX: Clear selectedStory when topic changes to prevent reusing old stories
              const topicChanged = topic !== workflowData.selectedTopic || subTopic !== workflowData.selectedSubTopic;
              updateWorkflowData({ 
                selectedTopic: topic, 
                selectedSubTopic: subTopic,
                ...(topicChanged && { selectedStory: undefined, script: undefined, videoConfig: undefined })
              });
              goToStep("research");
            }}
            selectedTopic={workflowData.selectedTopic}
            selectedSubTopic={workflowData.selectedSubTopic}
          />
        )}
        
        {currentStep === "research" && (
          <NewsResearch
            topic={workflowData.selectedTopic}
            subTopic={workflowData.selectedSubTopic}
            onNext={(storyId) => {
              updateWorkflowData({ selectedStory: storyId });
              goToStep("configure");
            }}
            onBack={() => goToStep("topics")}
            selectedStory={workflowData.selectedStory}
          />
        )}
        
        {currentStep === "configure" && (
          <VideoConfiguration
            onNext={(config) => {
              updateWorkflowData({ videoConfig: config });
              goToStep("script");
            }}
            onBack={() => goToStep("research")}
            initialConfig={workflowData.videoConfig}
          />
        )}
        
        {currentStep === "script" && (
          <ScriptGeneration
            storyId={workflowData.selectedStory}
            config={workflowData.videoConfig}
            onNext={(script) => {
              updateWorkflowData({ script });
              goToStep("create");
            }}
            onBack={() => goToStep("configure")}
            existingScript={workflowData.script}
          />
        )}
        
        {currentStep === "create" && (
          <VideoCreation
            script={workflowData.script}
            config={workflowData.videoConfig}
            onComplete={() => goToStep("library")}
            onBack={() => goToStep("script")}
          />
        )}
        
        {currentStep === "library" && (
          <VideoLibrary
            onCreateNew={() => {
              setWorkflowData({});
              goToStep("topics");
            }}
          />
        )}
      </div>
    </div>
  );
}
