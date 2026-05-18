// src/app/(backend)/api/series/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";

// GET /api/series/[id] — single series with modules, progress, and enrollment status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const series = await prisma.series.findUnique({
      where: { id },
      include: {
        exam: { select: { id: true, title: true, scope: true } },
        modules: {
          orderBy: { order: "asc" },
          include: {
            exam: { select: { id: true, title: true } },
            videos: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, durationSeconds: true, order: true },
            },
            moduleCompletions: { where: { userId: session.user.id }, take: 1 },
          },
        },
        seriesCompletions: { where: { userId: session.user.id }, take: 1 },
        enrollments: { where: { userId: session.user.id }, take: 1 },
      },
    });

    if (!series) return NextResponse.json({ error: "Series not found" }, { status: 404 });

    // Video progress for all videos in this series
    const allVideoIds = series.modules.flatMap((m) => m.videos.map((v) => v.id));
    const allProgress = await prisma.videoProgress.findMany({
      where: { userId: session.user.id, videoId: { in: allVideoIds } },
      select: { videoId: true, watchedSeconds: true, completedAt: true },
    });
    const progressMap = Object.fromEntries(allProgress.map((p) => [p.videoId, p]));

    const modules = series.modules.map((mod) => {
      const completedVideoCount = mod.videos.filter((v) => !!progressMap[v.id]?.completedAt).length;
      const firstIncomplete = mod.videos.find((v) => !progressMap[v.id]?.completedAt);
      return {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        videoCount: mod.videos.length,
        completedVideoCount,
        isCompleted: !!mod.moduleCompletions[0],
        moduleExam: mod.exam,
        nextVideoId: firstIncomplete?.id ?? mod.videos[0]?.id ?? null,
        videos: mod.videos.map((v) => ({
          id: v.id,
          title: v.title,
          durationSeconds: v.durationSeconds,
          order: v.order,
          isCompleted: !!progressMap[v.id]?.completedAt,
        })),
      };
    });

    const totalVideos     = allVideoIds.length;
    const completedVideos = allVideoIds.filter((vid) => !!progressMap[vid]?.completedAt).length;
    const progressPercent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

    return NextResponse.json({
      data: {
        id: series.id,
        title: series.title,
        description: series.description,
        thumbnailUrl: series.thumbnailUrl,
        isPublic: series.isPublic,
        requiresCertificate: series.requiresCertificate,
        isEnrolled: !!series.enrollments[0],
        seriesCompletion: series.seriesCompletions[0]
          ? { completedAt: series.seriesCompletions[0].completedAt.toISOString() }
          : null,
        seriesExam: series.exam,
        modules,
        totalVideos,
        completedVideos,
        progressPercent,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch series" }, { status: 500 });
  }
}

// PUT /api/series/[id] — update series metadata (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const body = await request.json() as {
      title?: string;
      description?: string;
      isPublic?: boolean;
      requiresCertificate?: boolean;
    };

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Series title is required." }, { status: 400 });
    }

    const series = await prisma.series.update({
      where: { id },
      data: {
        title:               body.title.trim(),
        description:         body.description?.trim() || null,
        isPublic:            body.isPublic ?? false,
        requiresCertificate: body.requiresCertificate ?? false,
      },
      include: { _count: { select: { modules: true } } },
    });

    return NextResponse.json({
      data: {
        id:                 series.id,
        title:              series.title,
        description:        series.description ?? null,
        isPublic:           series.isPublic,
        requiresCertificate: series.requiresCertificate,
        moduleCount:        series._count.modules,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update series." }, { status: 500 });
  }
}

// DELETE /api/series/[id] — cascade-delete series + all modules/videos (admin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const existing = await prisma.series.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Series not found." }, { status: 404 });

    await prisma.series.delete({ where: { id } });
    return NextResponse.json({ data: { id } });
  } catch {
    return NextResponse.json({ error: "Failed to delete series." }, { status: 500 });
  }
}
