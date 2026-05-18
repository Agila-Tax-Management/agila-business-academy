// src/app/(backend)/api/videos/[id]/progress/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";

const progressSchema = z.object({
  watchedSeconds: z.number().int().nonnegative(),
  durationSeconds: z.number().int().nonnegative(),
});

// POST /api/videos/[id]/progress — upsert VideoProgress; marks completedAt at ≥90%
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = progressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { watchedSeconds, durationSeconds } = parsed.data;

  try {
    const video = await prisma.video.findUnique({ where: { id }, select: { id: true } });
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    const isComplete = durationSeconds > 0 && watchedSeconds / durationSeconds >= 0.9;

    const existing = await prisma.videoProgress.findUnique({
      where: { userId_videoId: { userId: session.user.id, videoId: id } },
    });

    const progress = await prisma.videoProgress.upsert({
      where: { userId_videoId: { userId: session.user.id, videoId: id } },
      create: {
        userId: session.user.id,
        videoId: id,
        watchedSeconds,
        durationSeconds,
        completedAt: isComplete ? new Date() : null,
      },
      update: {
        watchedSeconds: Math.max(watchedSeconds, existing?.watchedSeconds ?? 0),
        durationSeconds,
        ...(isComplete && !existing?.completedAt ? { completedAt: new Date() } : {}),
      },
    });

    const firstCompletion = isComplete && !existing?.completedAt;

    return NextResponse.json({
      data: {
        completed: !!progress.completedAt,
        firstCompletion,
        progress: {
          watchedSeconds: progress.watchedSeconds,
          durationSeconds: progress.durationSeconds,
          completedAt: progress.completedAt,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
