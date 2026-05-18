// src/app/(backend)/api/modules/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";

// GET /api/modules/[id] — single module with videos, progress, exam, and navigation
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const mod = await prisma.module.findUnique({
      where: { id },
      include: {
        series: {
          include: {
            modules: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, order: true },
            },
          },
        },
        exam: { select: { id: true, title: true, scope: true, passingScore: true } },
        videos: {
          orderBy: { order: "asc" },
          include: {
            exam: { select: { id: true } },
            videoProgress: { where: { userId: session.user.id }, take: 1 },
          },
        },
        moduleCompletions: { where: { userId: session.user.id }, take: 1 },
      },
    });

    if (!mod) return NextResponse.json({ error: "Module not found" }, { status: 404 });

    // Best exam attempt for the module exam
    let bestAttempt: { score: number; passed: boolean } | null = null;
    if (mod.exam) {
      const attempt = await prisma.examAttempt.findFirst({
        where: { userId: session.user.id, examId: mod.exam.id },
        orderBy: { score: "desc" },
      });
      if (attempt) bestAttempt = { score: attempt.score, passed: attempt.passed };
    }

    // Prev / next module
    const siblings   = mod.series.modules;
    const currentIdx = siblings.findIndex((m) => m.id === id);
    const prevModule = currentIdx > 0 ? siblings[currentIdx - 1] : null;
    const nextModule = currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null;

    const videos = mod.videos.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      durationSeconds: v.durationSeconds,
      order: v.order,
      videoExam: v.exam ? { id: v.exam.id } : null,
      progress: v.videoProgress[0]
        ? {
            watchedSeconds: v.videoProgress[0].watchedSeconds,
            durationSeconds: v.videoProgress[0].durationSeconds,
            completedAt: v.videoProgress[0].completedAt?.toISOString() ?? null,
          }
        : null,
    }));

    const allVideosCompleted = videos.length > 0 && videos.every((v) => !!v.progress?.completedAt);

    return NextResponse.json({
      data: {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        series: { id: mod.series.id, title: mod.series.title },
        isCompleted: !!mod.moduleCompletions[0],
        allVideosCompleted,
        moduleExam: mod.exam,
        bestAttempt,
        videos,
        prevModule: prevModule ? { id: prevModule.id, title: prevModule.title } : null,
        nextModule: nextModule ? { id: nextModule.id, title: nextModule.title } : null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch module" }, { status: 500 });
  }
}

// PUT /api/modules/[id] — update module (admin only)
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
      seriesId?: string;
      title?: string;
      description?: string;
    };

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Module title is required." }, { status: 400 });
    }

    const existing = await prisma.module.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Module not found." }, { status: 404 });

    const updateData: { title: string; description: string | null; seriesId?: string } = {
      title:       body.title.trim(),
      description: body.description?.trim() || null,
    };
    if (body.seriesId) updateData.seriesId = body.seriesId;

    const mod = await prisma.module.update({
      where: { id },
      data: updateData,
      include: {
        series: { select: { title: true } },
        _count: { select: { videos: true } },
      },
    });

    return NextResponse.json({
      data: {
        id:          mod.id,
        seriesId:    mod.seriesId,
        seriesTitle: mod.series.title,
        title:       mod.title,
        description: mod.description ?? null,
        order:       mod.order,
        videoCount:  mod._count.videos,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update module." }, { status: 500 });
  }
}

// DELETE /api/modules/[id] — cascade-delete module + its videos (admin only)
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
    const existing = await prisma.module.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Module not found." }, { status: 404 });

    await prisma.module.delete({ where: { id } });
    return NextResponse.json({ data: { id } });
  } catch {
    return NextResponse.json({ error: "Failed to delete module." }, { status: 500 });
  }
}
