// src/app/(backend)/api/exams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ExamScope } from "@/generated/prisma";

export type { ExamScope };

export interface ExamItem {
  id: string;
  title: string;
  scope: ExamScope;
  linkedId: string;
  linkedTo: string;
  questionCount: number;
  passingScore: number;
  maxAttempts: number;
  timeLimitMin: number | null;
  createdAt: string;
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const exams = await prisma.exam.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { questions: true } },
        video:  { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
        series: { select: { id: true, title: true } },
      },
    });

    const data: ExamItem[] = exams.map((e) => {
      const linked =
        e.scope === "VIDEO"  ? e.video  :
        e.scope === "MODULE" ? e.module :
        e.series;
      return {
        id:            e.id,
        title:         e.title,
        scope:         e.scope,
        linkedId:      linked?.id ?? "",
        linkedTo:      linked?.title ?? "",
        questionCount: e._count.questions,
        passingScore:  e.passingScore,
        maxAttempts:   e.maxAttempts,
        timeLimitMin:  e.timeLimitMin,
        createdAt:     e.createdAt.toISOString().split("T")[0],
      };
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch exams." }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json() as {
      title?: string;
      scope?: ExamScope;
      linkedId?: string;
      passingScore?: number;
      maxAttempts?: number;
      timeLimitMin?: number | null;
    };
    const { title, scope, linkedId, passingScore, maxAttempts, timeLimitMin } = body;

    if (!title?.trim() || !scope) {
      return NextResponse.json({ error: "Title and scope are required." }, { status: 400 });
    }

    const exam = await prisma.exam.create({
      data: {
        title:        title.trim(),
        scope,
        videoId:      scope === "VIDEO"  ? (linkedId || null) : null,
        moduleId:     scope === "MODULE" ? (linkedId || null) : null,
        seriesId:     scope === "SERIES" ? (linkedId || null) : null,
        passingScore: passingScore ?? 75,
        maxAttempts:  maxAttempts  ?? 0,
        timeLimitMin: timeLimitMin ?? null,
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

    const data: ExamItem = {
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
    };

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create exam." }, { status: 500 });
  }
}
