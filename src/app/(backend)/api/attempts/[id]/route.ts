// src/app/(backend)/api/attempts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface ResultChoice {
  id:        string;
  text:      string;
  isCorrect: boolean;
  selected:  boolean;
}

export interface ResultQuestion {
  id:                string;
  text:              string;
  type:              "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  isCorrect:         boolean;
  textAnswer:        string | null;
  answerId:          string | null;  // ExamAnswer id for SHORT_ANSWER grading
  isManuallyCorrect: boolean | null; // null = pending admin review
  choices:           ResultChoice[];
}

export interface AttemptResult {
  id:              string;
  examId:          string;
  examTitle:       string;
  scope:           "VIDEO" | "MODULE" | "SERIES";
  linkedTitle:     string;
  backUrl:         string;
  score:           number;
  passed:          boolean;
  passingScore:    number;
  submittedAt:     string;
  certificateId:   string | null;
  questions:       ResultQuestion[];
}

// GET /api/attempts/[id] — full attempt result with per-question breakdown
export async function GET(
  _request: NextRequest,
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
              orderBy: { order: "asc" },
              include: {
                choices: { orderBy: { order: "asc" } },
              },
            },
            video:  { select: { id: true, title: true, moduleId: true, module: { select: { id: true, seriesId: true } } } },
            module: { select: { id: true, title: true, seriesId: true } },
            series: { select: { id: true, title: true } },
          },
        },
        answers: {
          select: { id: true, questionId: true, choiceId: true, textAnswer: true, isManuallyCorrect: true },
        },
      },
    });

    if (!attempt) return NextResponse.json({ error: "Attempt not found." }, { status: 404 });

    // Allow admin to view any attempt; learner can only see their own
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
    if (!isAdmin && attempt.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Map answers: questionId → { choiceIds, textAnswer, answerId, isManuallyCorrect }
    const selectedMap = new Map<string, { choiceIds: Set<string>; textAnswer: string | null; answerId: string | null; isManuallyCorrect: boolean | null }>();
    for (const ans of attempt.answers) {
      const entry = selectedMap.get(ans.questionId) ?? { choiceIds: new Set(), textAnswer: null, answerId: null, isManuallyCorrect: null };
      if (ans.choiceId)   entry.choiceIds.add(ans.choiceId);
      if (ans.textAnswer) entry.textAnswer = ans.textAnswer;
      // For SHORT_ANSWER rows there is no choiceId — store the answerId and manual grade
      if (!ans.choiceId)  {
        entry.answerId          = ans.id;
        entry.isManuallyCorrect = ans.isManuallyCorrect;
      }
      selectedMap.set(ans.questionId, entry);
    }

    const linked =
      attempt.exam.scope === "VIDEO"  ? attempt.exam.video  :
      attempt.exam.scope === "MODULE" ? attempt.exam.module :
      attempt.exam.series;

    // Compute the URL to return the learner to the relevant content page
    let backUrl = "/library";
    if (attempt.exam.scope === "VIDEO" && attempt.exam.video?.module) {
      backUrl = `/library/${attempt.exam.video.module.seriesId}/${attempt.exam.video.moduleId}`;
    } else if (attempt.exam.scope === "MODULE" && attempt.exam.module) {
      backUrl = `/library/${attempt.exam.module.seriesId}`;
    } else if (attempt.exam.scope === "SERIES" && attempt.exam.series) {
      backUrl = `/library/${attempt.exam.series.id}`;
    }

    const questions: ResultQuestion[] = attempt.exam.questions.map((q) => {
      const userEntry  = selectedMap.get(q.id);
      const correctIds = new Set(q.choices.filter((c) => c.isCorrect).map((c) => c.id));
      const selectedIds = userEntry?.choiceIds ?? new Set<string>();

      let qCorrect = false;
      if (q.type !== "SHORT_ANSWER") {
        // Correct if selected set exactly matches correct set
        const sArr = [...selectedIds].sort();
        const cArr = [...correctIds].sort();
        qCorrect = JSON.stringify(sArr) === JSON.stringify(cArr);
      }

      return {
        id:                q.id,
        text:              q.text,
        type:              q.type as ResultQuestion["type"],
        isCorrect:         qCorrect,
        textAnswer:        userEntry?.textAnswer ?? null,
        answerId:          userEntry?.answerId ?? null,
        isManuallyCorrect: userEntry?.isManuallyCorrect ?? null,
        choices:    q.choices.map((c) => ({
          id:        c.id,
          text:      c.text,
          isCorrect: c.isCorrect,
          selected:  selectedIds.has(c.id),
        })),
      };
    });

    // For SERIES exams that were passed, look up the issued certificate
    let certificateId: string | null = null;
    if (attempt.exam.scope === "SERIES" && attempt.passed && attempt.exam.series?.id) {
      const cert = await prisma.certificate.findUnique({
        where: { userId_seriesId: { userId: attempt.userId, seriesId: attempt.exam.series.id } },
        select: { id: true },
      });
      certificateId = cert?.id ?? null;
    }

    const data: AttemptResult = {
      id:            attempt.id,
      examId:        attempt.examId,
      examTitle:     attempt.exam.title,
      scope:         attempt.exam.scope as AttemptResult["scope"],
      linkedTitle:   linked?.title ?? "",
      backUrl,
      score:         attempt.score,
      passed:        attempt.passed,
      passingScore:  attempt.exam.passingScore,
      submittedAt:   (attempt.submittedAt ?? attempt.createdAt).toISOString(),
      certificateId,
      questions,
    };

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to load attempt." }, { status: 500 });
  }
}
