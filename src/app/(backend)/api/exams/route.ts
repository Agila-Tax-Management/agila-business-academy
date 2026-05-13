// src/app/(backend)/api/exams/route.ts
import { NextRequest, NextResponse } from "next/server";

export type ExamScope = "VIDEO" | "MODULE" | "SERIES";

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

const MOCK_EXAMS: ExamItem[] = [
  { id: "exam1", title: "Company Policies Quiz",        scope: "VIDEO",  linkedId: "vid1", linkedTo: "Introduction to Company Policies", questionCount: 3,  passingScore: 75, maxAttempts: 3, timeLimitMin: 15,   createdAt: "2026-04-20" },
  { id: "exam2", title: "Employee Benefits Assessment", scope: "MODULE", linkedId: "mod1", linkedTo: "Company Overview Module",          questionCount: 8,  passingScore: 75, maxAttempts: 2, timeLimitMin: null, createdAt: "2026-04-21" },
  { id: "exam3", title: "Onboarding Final Exam",        scope: "SERIES", linkedId: "ser1", linkedTo: "New Employee Onboarding",          questionCount: 20, passingScore: 80, maxAttempts: 1, timeLimitMin: 60,   createdAt: "2026-04-22" },
  { id: "exam4", title: "Safety Fundamentals Test",     scope: "VIDEO",  linkedId: "vid2", linkedTo: "Workplace Safety Overview",         questionCount: 5,  passingScore: 75, maxAttempts: 0, timeLimitMin: 10,   createdAt: "2026-04-25" },
];

export async function GET(_request: NextRequest): Promise<NextResponse> {
  // TODO: replace with real Prisma query
  return NextResponse.json({ data: MOCK_EXAMS });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as {
      title?: string;
      scope?: ExamScope;
      linkedId?: string;
      linkedTo?: string;
      passingScore?: number;
      maxAttempts?: number;
      timeLimitMin?: number | null;
    };
    const { title, scope, linkedId, linkedTo, passingScore, maxAttempts, timeLimitMin } = body;

    if (!title?.trim() || !scope) {
      return NextResponse.json({ error: "Title and scope are required." }, { status: 400 });
    }

    const newExam: ExamItem = {
      id:            crypto.randomUUID(),
      title:         title.trim(),
      scope,
      linkedId:      linkedId ?? "",
      linkedTo:      linkedTo ?? "",
      questionCount: 0,
      passingScore:  passingScore ?? 75,
      maxAttempts:   maxAttempts ?? 0,
      timeLimitMin:  timeLimitMin ?? null,
      createdAt:     new Date().toISOString().split("T")[0],
    };

    // TODO: real prisma.exam.create
    return NextResponse.json({ data: newExam }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create exam." }, { status: 500 });
  }
}
