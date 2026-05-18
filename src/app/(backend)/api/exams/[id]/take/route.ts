// src/app/(backend)/api/exams/[id]/take/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type TakeQuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";

export interface TakeChoice {
  id:   string;
  text: string;
}

export interface TakeQuestion {
  id:      string;
  text:    string;
  type:    TakeQuestionType;
  choices: TakeChoice[];
}

export interface TakeAttempt {
  id:          string;
  score:       number;
  passed:      boolean;
  submittedAt: string;
}

export interface TakeExam {
  id:            string;
  title:         string;
  scope:         "VIDEO" | "MODULE" | "SERIES";
  passingScore:  number;
  maxAttempts:   number;
  timeLimitMin:  number | null;
  questionCount: number;
  linkedTitle:   string;
  linkedId:      string;
}

// GET /api/exams/[id]/take — exam metadata + questions (no isCorrect) + attempt history
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: examId } = await params;

  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            choices: {
              orderBy: { order: "asc" },
              select: { id: true, text: true },
            },
          },
        },
        video:  { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
        series: { select: { id: true, title: true } },
        _count: { select: { questions: true } },
      },
    });

    if (!exam) return NextResponse.json({ error: "Exam not found." }, { status: 404 });

    const attempts = await prisma.examAttempt.findMany({
      where:   { userId: session.user.id, examId },
      orderBy: { createdAt: "desc" },
      select:  { id: true, score: true, passed: true, submittedAt: true, createdAt: true },
    });

    const canTake = exam.maxAttempts === 0 || attempts.length < exam.maxAttempts;

    const linked =
      exam.scope === "VIDEO"  ? exam.video  :
      exam.scope === "MODULE" ? exam.module :
      exam.series;

    return NextResponse.json({
      data: {
        exam: {
          id:            exam.id,
          title:         exam.title,
          scope:         exam.scope as TakeExam["scope"],
          passingScore:  exam.passingScore,
          maxAttempts:   exam.maxAttempts,
          timeLimitMin:  exam.timeLimitMin ?? null,
          questionCount: exam._count.questions,
          linkedTitle:   linked?.title ?? "",
          linkedId:      linked?.id   ?? "",
        } satisfies TakeExam,
        questions: exam.questions.map((q) => ({
          id:      q.id,
          text:    q.text,
          type:    q.type as TakeQuestionType,
          choices: q.choices,
        })) satisfies TakeQuestion[],
        attempts: attempts.map((a) => ({
          id:          a.id,
          score:       a.score,
          passed:      a.passed,
          submittedAt: (a.submittedAt ?? a.createdAt).toISOString(),
        })) satisfies TakeAttempt[],
        canTake,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load exam." }, { status: 500 });
  }
}
