// src/app/(backend)/api/attempts/[id]/grade/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const gradeSchema = z.object({
  grades: z.array(
    z.object({
      answerId:  z.string().min(1),
      isCorrect: z.boolean(),
    }),
  ).min(1),
});

// PATCH /api/attempts/[id]/grade — admin manually grades SHORT_ANSWER questions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: attemptId } = await params;

  const body = await request.json() as unknown;
  const parsed = gradeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { grades } = parsed.data;

  try {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: {
              include: {
                choices: { where: { isCorrect: true }, select: { id: true } },
              },
            },
            series: { select: { id: true, requiresCertificate: true } },
          },
        },
        answers: true,
      },
    });

    if (!attempt) return NextResponse.json({ error: "Attempt not found." }, { status: 404 });

    // Update isManuallyCorrect for each submitted grade
    await prisma.$transaction(
      grades.map(({ answerId, isCorrect }) =>
        prisma.examAnswer.update({
          where: { id: answerId },
          data:  { isManuallyCorrect: isCorrect },
        }),
      ),
    );

    // Re-fetch updated answers for recompute
    const updatedAnswers = await prisma.examAnswer.findMany({
      where: { attemptId },
    });

    // Build selected-choices map for MC/TF scoring
    const selectedMap = new Map<string, Set<string>>();
    for (const ans of updatedAnswers) {
      if (ans.choiceId) {
        const set = selectedMap.get(ans.questionId) ?? new Set<string>();
        set.add(ans.choiceId);
        selectedMap.set(ans.questionId, set);
      }
    }

    // Build manually-graded map for SA scoring
    const manualMap = new Map<string, boolean | null>();
    for (const ans of updatedAnswers) {
      const q = attempt.exam.questions.find((q) => q.id === ans.questionId);
      if (q?.type === "SHORT_ANSWER") {
        manualMap.set(ans.questionId, ans.isManuallyCorrect);
      }
    }

    let correctCount = 0;
    for (const q of attempt.exam.questions) {
      if (q.type === "SHORT_ANSWER") {
        if (manualMap.get(q.id) === true) correctCount++;
      } else {
        const submitted = [...(selectedMap.get(q.id) ?? new Set<string>())].sort();
        const correct   = q.choices.map((c) => c.id).sort();
        if (JSON.stringify(submitted) === JSON.stringify(correct)) correctCount++;
      }
    }

    const totalQuestions = attempt.exam.questions.length;
    const newScore  = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const newPassed = newScore >= attempt.exam.passingScore;
    const wasAlreadyPassed = attempt.passed;

    await prisma.examAttempt.update({
      where: { id: attemptId },
      data:  { score: newScore, passed: newPassed },
    });

    // Trigger completion cascade only if newly passed (not already passed before)
    if (newPassed && !wasAlreadyPassed) {
      const { scope, moduleId, seriesId, series } = attempt.exam;

      if (scope === "MODULE" && moduleId) {
        await prisma.moduleCompletion.upsert({
          where:  { userId_moduleId: { userId: attempt.userId, moduleId } },
          create: { userId: attempt.userId, moduleId },
          update: {},
        });
      }

      if (scope === "SERIES" && seriesId) {
        await prisma.seriesCompletion.upsert({
          where:  { userId_seriesId: { userId: attempt.userId, seriesId } },
          create: { userId: attempt.userId, seriesId },
          update: {},
        });

        if (series?.requiresCertificate) {
          await prisma.certificate.upsert({
            where:  { userId_seriesId: { userId: attempt.userId, seriesId } },
            create: { userId: attempt.userId, seriesId },
            update: {},
          });
        }
      }
    }

    return NextResponse.json({ data: { score: newScore, passed: newPassed } });
  } catch {
    return NextResponse.json({ error: "Failed to grade attempt." }, { status: 500 });
  }
}
