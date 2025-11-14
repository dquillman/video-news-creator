
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicId, subTopicId, forceRefresh = false } = body;

    // Get topic information
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        subTopics: true,
      },
    });

    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    const subTopic = subTopicId
      ? topic.subTopics.find(st => st.id === subTopicId)
      : null;

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Send initial progress
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            progress: 10,
            message: "Starting news research...",
          })}\n\n`));

          // Get existing stories if not forcing refresh
          if (!forceRefresh) {
            const existingStories = await prisma.newsStory.findMany({
              where: {
                topicId,
                subTopicId: subTopicId || undefined,
                createdAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                },
              },
              orderBy: { ranking: "asc" },
              take: 5,
            });

            if (existingStories.length > 0) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                progress: 100,
                message: "Found recent stories",
                stories: existingStories,
              })}\n\n`));
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              controller.close();
              return;
            }
          }

          // Generate research query
          const searchQuery = subTopic 
            ? `${topic.name} ${subTopic.name}` 
            : topic.name;

          console.log(`🔍 NEWS RESEARCH DEBUG:`, {
            topicId,
            topicName: topic.name,
            subTopicId: subTopicId || 'NONE',
            subTopicName: subTopic?.name || 'NONE',
            searchQuery,
            timestamp: new Date().toISOString()
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            progress: 30,
            message: `Researching "${searchQuery}" news...`,
          })}\n\n`));

          // Use LLM to research and rank news stories
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
                  role: 'user',
                  content: `Research and find the top 5 most interesting current news stories about "${searchQuery}". 
                  
                  For each story, provide:
                  - title: A compelling, informative headline
                  - summary: A brief 2-3 sentence summary
                  - content: More detailed content (3-4 paragraphs) suitable for a news video script
                  - ranking: Interest level from 1-5 (1 = highest public interest, most newsworthy)
                  
                  Focus on recent, factual stories that would engage viewers. 
                  Rank them based on public interest, impact, and newsworthiness.
                  
                  Please respond in JSON format with the following structure:
                  {
                    "newsStories": [
                      {
                        "title": "Story title here",
                        "summary": "Brief summary here",
                        "content": "Detailed content here",
                        "ranking": 1
                      }
                    ]
                  }
                  
                  Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`
                },
              ],
              response_format: { type: "json_object" },
              max_tokens: 3000,
              stream: true,
            }),
          });

          if (!llmResponse.ok) {
            throw new Error(`LLM API error: ${llmResponse.status}`);
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            progress: 60,
            message: "Analyzing news stories and ranking by interest...",
          })}\n\n`));

          const reader = llmResponse.body?.getReader();
          if (!reader) throw new Error("No response body from LLM");

          const decoder = new TextDecoder();
          let buffer = '';
          let partialRead = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            partialRead += decoder.decode(value, { stream: true });
            let lines = partialRead.split('\n');
            partialRead = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Process the final buffer
                  const finalResult = JSON.parse(buffer);
                  
                  console.log(`📰 LLM RETURNED STORIES:`, {
                    searchQuery,
                    storyCount: finalResult.newsStories?.length || 0,
                    firstStoryTitle: finalResult.newsStories?.[0]?.title || 'NONE',
                    timestamp: new Date().toISOString()
                  });
                  
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    progress: 80,
                    message: "Saving research results...",
                  })}\n\n`));

                  // Save stories to database
                  const savedStories = await Promise.all(
                    finalResult.newsStories.map(async (story: any) => {
                      const savedStory = await prisma.newsStory.create({
                        data: {
                          title: story.title,
                          summary: story.summary,
                          content: story.content,
                          ranking: story.ranking,
                          topicId,
                          subTopicId: subTopicId || undefined,
                          publishedAt: new Date(),
                        },
                      });
                      return savedStory;
                    })
                  );

                  // Send completion
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    progress: 100,
                    message: "Research completed successfully!",
                    stories: savedStories,
                  })}\n\n`));
                  
                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  buffer += parsed.choices?.[0]?.delta?.content || '';
                  
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    progress: Math.min(70 + Math.random() * 10, 79),
                    message: "Processing news content...",
                  })}\n\n`));
                } catch (e) {
                  // Skip invalid JSON chunks
                }
              }
            }
          }

        } catch (error) {
          console.error('Research error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            progress: 0,
            message: "Research failed",
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
    console.error("Error in news research:", error);
    return NextResponse.json(
      { error: "Failed to research news" },
      { status: 500 }
    );
  }
}
