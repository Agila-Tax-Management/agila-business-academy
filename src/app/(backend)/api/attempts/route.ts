// src/app/(backend)/api/attempts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";

export interface AttemptItem {
  id: string;
  employeeName: string;
  employeeEmail: string;
  employeeImage: string | null;
  examTitle: string;
  scope: "VIDEO" | "MODULE" | "SERIES";
  score: number;
  passed: boolean;
  submittedAt: string | null;
  attemptNumber: number;
  hasPendingReview: boolean;
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const attempts = await prisma.examAttempt.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, image: true } },
        exam: {
          select: {
            title: true,
            scope: true,
            questions: { select: { id: true, type: true } },
          },
        },
        answers: {
          where:  { question: { type: "SHORT_ANSWER" } },
          select: { isManuallyCorrect: true },
        },
      },
    });

    // Compute per-user-per-exam attempt number by walking in ascending order
    const countMap = new Map<string, number>();
    const attemptNumbers = new Map<string, number>();
    for (const a of [...attempts].reverse()) {
      const key = `${a.userId}:${a.examId}`;
      const n = (countMap.get(key) ?? 0) + 1;
      countMap.set(key, n);
      attemptNumbers.set(a.id, n);
    }

    const data: AttemptItem[] = attempts.map((a) => {
      const hasSA = a.exam.questions.some((q) => q.type === "SHORT_ANSWER");
      const hasPendingReview = hasSA && a.answers.some((ans) => ans.isManuallyCorrect === null);
      return {
        id: a.id,
        employeeName: a.user.name,
        employeeEmail: a.user.email,
        employeeImage: a.user.image ?? null,
        examTitle: a.exam.title,
        scope: a.exam.scope,
        score: a.score,
        passed: a.passed,
        submittedAt: a.submittedAt?.toISOString() ?? a.createdAt.toISOString(),
        attemptNumber: attemptNumbers.get(a.id) ?? 1,
        hasPendingReview,
      };
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to load results." }, { status: 500 });
  }
}
