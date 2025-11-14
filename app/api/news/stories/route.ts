
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const topicId = searchParams.get("topicId");
    const subTopicId = searchParams.get("subTopicId");

    // If topicId is provided, filter by topic
    // Otherwise, return all recent stories (for recovery panel)
    const whereClause = topicId
      ? {
          topicId,
          subTopicId: subTopicId || undefined,
        }
      : {};

    const stories = await prisma.newsStory.findMany({
      where: whereClause,
      orderBy: topicId ? { ranking: "asc" } : { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json(stories);
  } catch (error) {
    console.error("Error fetching news stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch news stories" },
      { status: 500 }
    );
  }
}
