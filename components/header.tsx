
"use client";

import { Button } from "@/components/ui/button";
import { Settings, HelpCircle, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <img
              src="/favicon.svg"
              alt="Video News Creator"
              className="w-8 h-8"
            />
            <div className="flex items-center space-x-3">
              <span className="text-lg font-bold">
                Video News Creator
              </span>
              <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-md bg-primary/10 text-primary border border-primary/20">
                v1.3.3
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {mounted && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleTheme}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4 mr-2" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 mr-2" />
                    Dark Mode
                  </>
                )}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                alert("Video News Creator v1.3.3\n\nThis application creates professional news videos using:\n• AI-powered news research\n• Script generation\n• Text-to-speech narration (gtts + ffmpeg-static)\n• TWO visual modes: Real Video or AI Images\n• Professional video compilation with transitions\n\nNew in v1.3.3:\n• 🎯 CRITICAL FIX: Python packages now properly accessible\n  - Uses actual pyenv Python binary with ALL packages installed\n  - Path: /opt/computersetup/.pyenv/versions/3.11.6/bin/python3\n  - Includes gtts, requests, and all dependencies\n  - TESTED before deployment (TTS generation confirmed working)\n• ✅ All previous features maintained:\n  - Bundled FFmpeg via ffmpeg-static package\n  - Two-stage TTS workflow (Python MP3 → Node.js WAV)\n  - Ultra-strict scene selection\n  - Professional voice narration with speed/pitch adjustments\n  - Dark/Light mode toggle\n\nVISUAL MODES:\n• Real Video = Professional stock footage from Pexels\n• AI Images = Still photorealistic template images\n\nFor support, contact the development team.");
              }}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Help
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                alert("Settings panel coming soon!\n\nFuture settings will include:\n• Default video duration\n• Preferred voice type\n• Image inclusion preferences\n• Export quality options");
              }}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
