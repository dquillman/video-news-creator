
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateTTS } from "@/lib/tts-generator";
import { generateVideo } from "@/lib/video-generator";
import { generateSceneImages } from "@/lib/image-generator";
import { fetchPexelsVideos } from "@/lib/pexels-video-fetcher";

import { VideoStatus, ScriptScene } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scriptId, duration, voiceType, includeImages, visualMode } = body;

    // Get the script and related data
    const script = await prisma.script.findUnique({
      where: { id: scriptId },
      include: {
        newsStory: {
          include: {
            topic: true,
            subTopic: true,
          },
        },
      },
    });

    if (!script) {
      return NextResponse.json(
        { error: "Script not found" },
        { status: 404 }
      );
    }

    // Create video record
    const video = await prisma.video.create({
      data: {
        title: `${script.newsStory.title} - News Video`,
        description: script.newsStory.summary,
        duration,
        voiceType,
        includeImages,
        status: VideoStatus.PENDING,
        scriptId,
      },
    });

    // Create streaming response for video creation
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Update video status to processing
          await prisma.video.update({
            where: { id: video.id },
            data: { status: VideoStatus.PROCESSING },
          });

          // Stage 1: Preparing
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            stage: "preparing",
            progress: 10,
            message: "Preparing video generation...",
            videoId: video.id,
            estimatedTimeRemaining: 120,
          })}\n\n`));

          // Stage 2: Generate TTS Audio
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            stage: "tts",
            progress: 25,
            message: "Generating voice narration...",
            videoId: video.id,
            estimatedTimeRemaining: 90,
          })}\n\n`));

          const audioPath = await generateTTS(script.content, voiceType);
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            stage: "tts",
            progress: 45,
            message: "Voice narration generated successfully",
            videoId: video.id,
            estimatedTimeRemaining: 75,
          })}\n\n`));

          // Stage 3: Fetch visual content based on selected mode
          let sceneVideos: { videoPath: string; sceneNumber: number; duration: number }[] = [];
          let sceneImages: { scenePath: string; sceneNumber: number }[] = [];
          let scenes: ScriptScene[] = [];
          
          // Try to get scenes from the script
          if (script.scenes && Array.isArray(script.scenes) && script.scenes.length > 0) {
            scenes = script.scenes as unknown as ScriptScene[];
            
            // Choose visual content based on user preference
            if (visualMode === "real-video" || !visualMode) {
              // Fetch real video footage from Pexels
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                stage: "videos",
                progress: 55,
                message: `Fetching ${scenes.length} real video clips...`,
                videoId: video.id,
                estimatedTimeRemaining: 60,
              })}\n\n`));

              try {
                // Pass topic context for more relevant video selection
                const topicContext = {
                  topic: script.newsStory.topic?.name || '',
                  subTopic: script.newsStory.subTopic?.name || undefined,
                };
                
                sceneVideos = await fetchPexelsVideos(scenes, topicContext);
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  stage: "videos",
                  progress: 65,
                  message: `Downloaded ${sceneVideos.length} real video clips`,
                  videoId: video.id,
                  estimatedTimeRemaining: 45,
                })}\n\n`));
              } catch (error) {
                console.error('Error fetching Pexels videos, falling back to images:', error);
                
                // Fallback to images if Pexels fails
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  stage: "images",
                  progress: 60,
                  message: `Generating ${scenes.length} scene images (fallback)...`,
                  videoId: video.id,
                  estimatedTimeRemaining: 50,
                })}\n\n`));
                
                sceneImages = await generateSceneImages(scenes);
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  stage: "images",
                  progress: 65,
                  message: `Generated ${sceneImages.length} scene images`,
                  videoId: video.id,
                  estimatedTimeRemaining: 45,
                })}\n\n`));
              }
            } else {
              // AI images mode (still images)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                stage: "images",
                progress: 55,
                message: `Generating ${scenes.length} AI scene images...`,
                videoId: video.id,
                estimatedTimeRemaining: 60,
              })}\n\n`));
              
              sceneImages = await generateSceneImages(scenes);
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                stage: "images",
                progress: 65,
                message: `Generated ${sceneImages.length} AI scene images`,
                videoId: video.id,
                estimatedTimeRemaining: 45,
              })}\n\n`));
            }
          }

          // Stage 4: Generate Video
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            stage: "video",
            progress: 75,
            message: sceneVideos.length > 0 
              ? `Processing ${sceneVideos.length} video clips...` 
              : `Creating multi-scene video...`,
            videoId: video.id,
            estimatedTimeRemaining: sceneVideos.length > 0 ? 60 : 30,
          })}\n\n`));

          let videoResult;
          try {
            videoResult = await generateVideo({
              audioPath,
              imagePaths: [], // Legacy parameter, not used with scene-based generation
              sceneVideos: sceneVideos.length > 0 ? sceneVideos : undefined, // Real video clips
              sceneImages: sceneImages.length > 0 ? sceneImages : undefined, // Fallback to images
              title: script.newsStory.title,
              duration,
              includeImages,
              scenes: scenes.length > 0 ? scenes : undefined,
            });

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              stage: "video",
              progress: 85,
              message: "Video processing complete, finalizing...",
              videoId: video.id,
              estimatedTimeRemaining: 15,
            })}\n\n`));

          } catch (videoError) {
            console.error('Video generation failed:', videoError);
            throw new Error(`Video generation failed: ${videoError instanceof Error ? videoError.message : 'Unknown error'}`);
          }

          const { videoPath, actualDuration, fileSize } = videoResult;

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            stage: "video",
            progress: 90,
            message: "Finalizing video...",
            videoId: video.id,
            estimatedTimeRemaining: 10,
          })}\n\n`));

          // Generate download URL (in production, this would be a CDN URL)
          const downloadUrl = `/api/videos/${video.id}/download`;

          // Update video record with completion data
          const completedVideo = await prisma.video.update({
            where: { id: video.id },
            data: {
              status: VideoStatus.COMPLETED,
              filePath: videoPath,
              fileSize: fileSize.toString(),
              actualDuration,
              downloadUrl,
              completedAt: new Date(),
            },
          });

          // Stage 5: Completed
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            stage: "completed",
            progress: 100,
            message: "Video created successfully!",
            videoId: video.id,
            downloadUrl,
            estimatedTimeRemaining: 0,
          })}\n\n`));

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();

        } catch (error) {
          console.error('Video creation error:', error);
          
          // Update video status to error
          await prisma.video.update({
            where: { id: video.id },
            data: { 
              status: VideoStatus.ERROR,
              errorMessage: error instanceof Error ? error.message : "Unknown error",
            },
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            stage: "error",
            progress: 0,
            message: "Video creation failed",
            videoId: video.id,
            error: error instanceof Error ? error.message : "Unknown error",
          })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("Error in video creation:", error);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}
