
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const scripts = await prisma.script.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        newsStory: true,
      },
    });

    return NextResponse.json(scripts);
  } catch (error) {
    console.error("Failed to fetch scripts:", error);
    return NextResponse.json(
      { error: "Failed to fetch scripts" },
      { status: 500 }
    );
  }
}
