// src/app/(backend)/api/enrollment/route.ts
import { NextRequest, NextResponse } from "next/server";

export interface EnrollmentItem {
  id: string;
  userId: string;
  seriesId: string;
  seriesTitle: string;
  enrolledAt: string;
}

const MOCK_ENROLLMENTS: EnrollmentItem[] = [
  { id: "enr1", userId: "emp1", seriesId: "ser1", seriesTitle: "New Employee Onboarding",     enrolledAt: "2026-01-20T08:00:00Z" },
  { id: "enr2", userId: "emp1", seriesId: "ser2", seriesTitle: "Safety & Compliance",         enrolledAt: "2026-02-01T08:00:00Z" },
  { id: "enr3", userId: "emp2", seriesId: "ser1", seriesTitle: "New Employee Onboarding",     enrolledAt: "2026-02-05T08:00:00Z" },
  { id: "enr4", userId: "emp2", seriesId: "ser2", seriesTitle: "Safety & Compliance",         enrolledAt: "2026-02-10T08:00:00Z" },
  { id: "enr5", userId: "emp2", seriesId: "ser3", seriesTitle: "Customer Service Excellence", enrolledAt: "2026-03-01T08:00:00Z" },
  { id: "enr6", userId: "emp3", seriesId: "ser2", seriesTitle: "Safety & Compliance",         enrolledAt: "2026-02-14T08:00:00Z" },
  { id: "enr7", userId: "emp4", seriesId: "ser1", seriesTitle: "New Employee Onboarding",     enrolledAt: "2026-03-05T08:00:00Z" },
  { id: "enr8", userId: "emp4", seriesId: "ser3", seriesTitle: "Customer Service Excellence", enrolledAt: "2026-03-15T08:00:00Z" },
];

export async function GET(request: NextRequest): Promise<NextResponse> {
  // TODO: replace with real Prisma query
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const data = userId
    ? MOCK_ENROLLMENTS.filter((e) => e.userId === userId)
    : MOCK_ENROLLMENTS;
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { userId?: string; seriesId?: string; seriesTitle?: string };
    const { userId, seriesId, seriesTitle } = body;

    if (!userId || !seriesId) {
      return NextResponse.json({ error: "userId and seriesId are required." }, { status: 400 });
    }

    const exists = MOCK_ENROLLMENTS.find((e) => e.userId === userId && e.seriesId === seriesId);
    if (exists) {
      return NextResponse.json({ error: "Employee is already enrolled in this series." }, { status: 409 });
    }

    const newEnrollment: EnrollmentItem = {
      id:          crypto.randomUUID(),
      userId,
      seriesId,
      seriesTitle: seriesTitle ?? "Unknown Series",
      enrolledAt:  new Date().toISOString(),
    };

    // TODO: real prisma.enrollment.create
    return NextResponse.json({ data: newEnrollment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to enroll employee." }, { status: 500 });
  }
}
