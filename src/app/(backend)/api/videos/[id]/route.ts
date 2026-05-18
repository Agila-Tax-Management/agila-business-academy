// src/app/(backend)/api/videos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

// GET /api/videos/[id] — single video with module/series/exam/progress
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            series: { select: { id: true, title: true, isPublic: true } },
            videos: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, order: true, durationSeconds: true },
            },
          },
        },
        exam: { select: { id: true, title: true, scope: true } },
        videoProgress: { where: { userId: session.user.id }, take: 1 },
      },
    });

    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    const { role } = session.user as { role?: string };
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

    if (!isAdmin && !video.module.series.isPublic) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_seriesId: { userId: session.user.id, seriesId: video.module.series.id } },
      });
      if (!enrollment) {
        return NextResponse.json({ error: "Not enrolled in this series" }, { status: 403 });
      }
    }

    // Sibling progress map
    const siblingIds = video.module.videos.map((v) => v.id);
    const allProgress = await prisma.videoProgress.findMany({
      where: { userId: session.user.id, videoId: { in: siblingIds } },
      select: { videoId: true, watchedSeconds: true, completedAt: true },
    });
    const progressMap = Object.fromEntries(allProgress.map((p) => [p.videoId, p]));

    const siblings = video.module.videos.map((v) => ({
      ...v,
      progress: progressMap[v.id] ?? null,
    }));

    const currentIndex = siblings.findIndex((v) => v.id === id);
    const prev = currentIndex > 0 ? siblings[currentIndex - 1] : null;
    const next = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

    return NextResponse.json({
      data: {
        id: video.id,
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        durationSeconds: video.durationSeconds,
        order: video.order,
        module: {
          id: video.module.id,
          title: video.module.title,
          series: { id: video.module.series.id, title: video.module.series.title },
        },
        exam: video.exam,
        progress: video.videoProgress[0] ?? null,
        siblings,
        prevVideo: prev ? { id: prev.id, title: prev.title } : null,
        nextVideo: next ? { id: next.id, title: next.title } : null,
        currentIndex,
        totalVideos: siblings.length,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 });
  }
}

// DELETE /api/videos/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role } = session.user as { role?: string };
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    // Delete from Cloudinary if we have the public_id
    if (video.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(video.cloudinaryPublicId, { resource_type: "video" });
    }

    await prisma.video.delete({ where: { id } });

    return NextResponse.json({ data: { id } });
  } catch {
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
