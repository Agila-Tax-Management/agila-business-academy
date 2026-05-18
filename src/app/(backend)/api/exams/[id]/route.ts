// src/app/(backend)/api/exams/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { ExamScope } from "@/generated/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json() as {
      title?: string;
      scope?: ExamScope;
      linkedId?: string;
      passingScore?: number;
      maxAttempts?: number;
      timeLimitMin?: number | null;
    };
    const { title, scope, linkedId, passingScore, maxAttempts, timeLimitMin } = body;

    const exam = await prisma.exam.update({
      where: { id },
      data: {
        ...(title        && { title: title.trim() }),
        ...(scope        && { scope }),
        ...(scope === "VIDEO"  && { videoId: linkedId || null, moduleId: null, seriesId: null }),
        ...(scope === "MODULE" && { moduleId: linkedId || null, videoId: null, seriesId: null }),
        ...(scope === "SERIES" && { seriesId: linkedId || null, videoId: null, moduleId: null }),
        ...(passingScore !== undefined && { passingScore }),
        ...(maxAttempts  !== undefined && { maxAttempts }),
        ...(timeLimitMin !== undefined && { timeLimitMin: timeLimitMin ?? null }),
      },
      include: {
        _count: { select: { questions: true } },
        video:  { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
        series: { select: { id: true, title: true } },
      },
    });

    const linked =
      exam.scope === "VIDEO"  ? exam.video  :
      exam.scope === "MODULE" ? exam.module :
      exam.series;

    return NextResponse.json({
      data: {
        id:            exam.id,
        title:         exam.title,
        scope:         exam.scope,
        linkedId:      linked?.id ?? "",
        linkedTo:      linked?.title ?? "",
        questionCount: exam._count.questions,
        passingScore:  exam.passingScore,
        maxAttempts:   exam.maxAttempts,
        timeLimitMin:  exam.timeLimitMin,
        createdAt:     exam.createdAt.toISOString().split("T")[0],
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update exam." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.exam.delete({ where: { id } });
    return NextResponse.json({ data: { id } });
  } catch {
    return NextResponse.json({ error: "Failed to delete exam." }, { status: 500 });
  }
}
