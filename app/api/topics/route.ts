
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      where: { isActive: true },
      include: {
        subTopics: {
          where: { isActive: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(topics);
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, subTopics } = body;

    const topic = await prisma.topic.create({
      data: {
        name,
        description,
        subTopics: subTopics?.length > 0 ? {
          create: subTopics.map((subTopic: any) => ({
            name: subTopic.name,
            description: subTopic.description,
          }))
        } : undefined,
      },
      include: {
        subTopics: true,
      },
    });

    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error("Error creating topic:", error);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    );
  }
}
