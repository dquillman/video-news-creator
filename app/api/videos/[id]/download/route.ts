
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { promises as fs } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const video = await prisma.video.findUnique({
      where: { id: params.id },
    });

    if (!video || !video.filePath) {
      return NextResponse.json(
        { error: "Video not found or file unavailable" },
        { status: 404 }
      );
    }

    // Check if file exists
    try {
      await fs.access(video.filePath);
    } catch {
      return NextResponse.json(
        { error: "Video file not found on disk" },
        { status: 404 }
      );
    }

    // Read the video file
    const fileBuffer = await fs.readFile(video.filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${video.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error serving video download:", error);
    return NextResponse.json(
      { error: "Failed to download video" },
      { status: 500 }
    );
  }
}
