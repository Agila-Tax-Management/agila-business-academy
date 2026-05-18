// src/app/(backend)/api/exams/[id]/attempts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/exams/[id]/attempts — create a new attempt (enforces maxAttempts)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: examId } = await params;

  try {
    const exam = await prisma.exam.findUnique({
      where:  { id: examId },
      select: { id: true, maxAttempts: true },
    });
    if (!exam) return NextResponse.json({ error: "Exam not found." }, { status: 404 });

    if (exam.maxAttempts > 0) {
      const count = await prisma.examAttempt.count({
        where: { userId: session.user.id, examId },
      });
      if (count >= exam.maxAttempts) {
        return NextResponse.json(
          { error: "Maximum attempts reached for this exam." },
          { status: 403 },
        );
      }
    }

    const attempt = await prisma.examAttempt.create({
      data: { userId: session.user.id, examId },
    });

    return NextResponse.json({ data: { attemptId: attempt.id } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to start exam." }, { status: 500 });
  }
}
