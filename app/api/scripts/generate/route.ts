
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for script + image generation

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import path from "path";
import { promises as fs } from "fs";
import https from "https";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyId, duration, voiceType, includeImages } = body;

    // Get the news story
    const newsStory = await prisma.newsStory.findUnique({
      where: { id: storyId },
      include: {
        topic: true,
        subTopic: true,
      },
    });

    if (!newsStory) {
      return NextResponse.json(
        { error: "News story not found" },
        { status: 404 }
      );
    }

    // Create streaming response for script generation
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Send initial progress
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            progress: 10,
            message: "Analyzing news story...",
          })}\n\n`));

          // Check for existing script
          const existingScript = await prisma.script.findFirst({
            where: { newsStoryId: storyId },
          });

          if (existingScript) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              progress: 100,
              message: "Found existing script",
              script: existingScript,
            })}\n\n`));
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
            return;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            progress: 30,
            message: "Generating news script...",
          })}\n\n`));

          // Generate scene-based script using LLM
          const llmResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-4.1-mini',
              messages: [
                {
                  role: 'system',
                  content: `You are a professional news script writer creating scene-based video scripts. You MUST respond with a valid JSON object containing a "scenes" array. Each scene should have narration and visual description.`
                },
                {
                  role: 'user',
                  content: `Create a professional news video script broken down into 4-6 scenes based on this story:
                  
                  Title: "${newsStory.title}"
                  Content: "${newsStory.content}"
                  Topic: "${newsStory.topic.name}${newsStory.subTopic ? ' - ' + newsStory.subTopic.name : ''}"
                  
                  Script Requirements:
                  - Target duration: ${duration} seconds (divide evenly across scenes)
                  - Voice type: ${voiceType} professional narrator(s)
                  - Professional, clear, and engaging tone
                  - Suitable for text-to-speech generation
                  - Average speaking rate: 155 words per minute
                  - CRITICAL: DO NOT include scene numbers or markers in the narration text. Write naturally flowing narration that will be spoken by professional announcers.
                  
                  IMPORTANT: Return ONLY a valid JSON object in this exact format:
                  {
                    "scenes": [
                      {
                        "sceneNumber": 1,
                        "narration": "Opening hook text here...",
                        "visualDescription": "Detailed description of what should be shown visually during this narration",
                        "duration": ${Math.round(duration / 5)}
                      },
                      ... (4-6 total scenes)
                    ]
                  }
                  
                  Scene Guidelines:
                  - Scene 1: Compelling opening hook (10-15% of time)
                  - Scene 2-3: Present key facts and context (50-60% of time)
                  - Scene 4-5: Analysis and deeper insights (20-25% of time)
                  - Final Scene: Strong conclusion (10-15% of time)
                  
                  Visual Description Guidelines:
                  - Be specific and descriptive for AI image generation
                  - Include relevant objects, settings, people, actions
                  - Focus on news-appropriate, professional imagery
                  - Example: "Modern office building with people working at computers, showing data analytics dashboards on screens"
                  
                  Target total word count: approximately ${Math.round((duration / 60) * 155)} words across all scenes.`
                },
              ],
              max_tokens: 2500,
              stream: false,
            }),
          });

          if (!llmResponse.ok) {
            throw new Error(`LLM API error: ${llmResponse.status}`);
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            progress: 60,
            message: "Processing script content...",
          })}\n\n`));

          // Parse the non-streaming response
          const llmData = await llmResponse.json();
          const responseContent = llmData.choices?.[0]?.message?.content || '';
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            progress: 70,
            message: "Parsing scenes...",
          })}\n\n`));

          // Parse the JSON response to extract scenes
          let scenes;
          let scriptContent = '';
          try {
            // Extract JSON from the response (handle cases where LLM adds extra text)
            const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              throw new Error('No valid JSON found in response');
            }
            
            const parsedResponse = JSON.parse(jsonMatch[0]);
            scenes = parsedResponse.scenes;
            
            if (!Array.isArray(scenes) || scenes.length === 0) {
              throw new Error('Invalid scenes array');
            }

            // Combine all scene narrations into a single script content
            // Note: Scene numbers are NOT included in narration - they're only for internal reference
            scriptContent = scenes.map((scene: any) => 
              scene.narration
            ).join('\n\n');

          } catch (parseError) {
            console.error('Error parsing scene-based response:', parseError);
            // Fallback: treat as plain text and create a single scene
            scriptContent = responseContent;
            scenes = [{
              sceneNumber: 1,
              narration: responseContent,
              visualDescription: newsStory.title,
              duration: duration
            }];
          }

          // Note: AI images will be stored without URLs - image-generator.ts will handle them
          // This approach avoids backend API limitations
          const scenesWithImages = scenes.map(scene => ({
            ...scene,
            imageUrl: null, // Will be generated during video creation
            imagePath: null,
          }));

          // Save the generated script with image URLs
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            progress: 90,
            message: "Saving script with AI images...",
          })}\n\n`));

          const savedScript = await prisma.script.create({
            data: {
              title: `${newsStory.title} - Video Script`,
              content: scriptContent.trim(),
              scenes: scenesWithImages, // Store scenes with image URLs as JSON
              duration: duration,
              newsStoryId: storyId,
            },
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            progress: 100,
            message: "Script generated successfully!",
            script: savedScript,
          })}\n\n`));
          
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();

        } catch (error) {
          console.error('Script generation error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            progress: 0,
            message: "Script generation failed",
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
    console.error("Error in script generation:", error);
    return NextResponse.json(
      { error: "Failed to generate script" },
      { status: 500 }
    );
  }
}
