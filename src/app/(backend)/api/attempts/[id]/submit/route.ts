// src/app/(backend)/api/attempts/[id]/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface AnswerInput {
  questionId: string;
  choiceIds:  string[];
  textAnswer?: string;
}

// POST /api/attempts/[id]/submit — score + persist answers; cascade completions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: attemptId } = await params;

  try {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: {
              include: {
                choices: {
                  where:  { isCorrect: true },
                  select: { id: true },
                },
              },
            },
            series: { select: { id: true, requiresCertificate: true } },
          },
        },
      },
    });

    if (!attempt)                          return NextResponse.json({ error: "Attempt not found." },        { status: 404 });
    if (attempt.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" },               { status: 403 });
    if (attempt.submittedAt)                return NextResponse.json({ error: "Exam already submitted." }, { status: 409 });

    const body = await request.json() as { answers: AnswerInput[] };
    const answersMap = new Map(
      body.answers.map((a) => [a.questionId, a]),
    );

    // Auto-grade MULTIPLE_CHOICE and TRUE_FALSE
    let correctCount = 0;
    for (const q of attempt.exam.questions) {
      if (q.type === "SHORT_ANSWER") continue;
      const submitted = [...(answersMap.get(q.id)?.choiceIds ?? [])].sort();
      const correct   = q.choices.map((c) => c.id).sort();
      if (JSON.stringify(submitted) === JSON.stringify(correct)) correctCount++;
    }

    const totalQuestions = attempt.exam.questions.length;
    const score  = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= attempt.exam.passingScore;

    // Persist answers + update attempt in a transaction
    await prisma.$transaction(async (tx) => {
      for (const ans of body.answers) {
        if (ans.choiceIds?.length > 0) {
          for (const choiceId of ans.choiceIds) {
            await tx.examAnswer.create({
              data: { attemptId, questionId: ans.questionId, choiceId },
            });
          }
        } else if (ans.textAnswer?.trim()) {
          await tx.examAnswer.create({
            data: { attemptId, questionId: ans.questionId, textAnswer: ans.textAnswer },
          });
        }
      }

      await tx.examAttempt.update({
        where: { id: attemptId },
        data:  { score, passed, submittedAt: new Date() },
      });
    });

    // Cascade completions on pass
    if (passed) {
      const { scope, moduleId, seriesId, series } = attempt.exam;

      if (scope === "MODULE" && moduleId) {
        await prisma.moduleCompletion.upsert({
          where:  { userId_moduleId: { userId: session.user.id, moduleId } },
          create: { userId: session.user.id, moduleId },
          update: {},
        });
      }

      if (scope === "SERIES" && seriesId) {
        await prisma.seriesCompletion.upsert({
          where:  { userId_seriesId: { userId: session.user.id, seriesId } },
          create: { userId: session.user.id, seriesId },
          update: {},
        });

        if (series?.requiresCertificate) {
          await prisma.certificate.upsert({
            where:  { userId_seriesId: { userId: session.user.id, seriesId } },
            create: { userId: session.user.id, seriesId },
            update: {},
          });
        }
      }
    }

    return NextResponse.json({ data: { score, passed, attemptId } });
  } catch {
    return NextResponse.json({ error: "Failed to submit exam." }, { status: 500 });
  }
}
