// src/app/(backend)/api/enrollment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface EnrollmentItem {
  id: string;
  userId: string;
  seriesId: string;
  seriesTitle: string;
  enrolledAt: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  // Learners may only read their own enrollments; admins may read any
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (userId && userId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: userId ? { userId } : isAdmin ? {} : { userId: session.user.id },
      include: { series: { select: { title: true } } },
      orderBy: { createdAt: "asc" },
    });

    const data: EnrollmentItem[] = enrollments.map((e) => ({
      id:          e.id,
      userId:      e.userId,
      seriesId:    e.seriesId,
      seriesTitle: e.series.title,
      enrolledAt:  e.createdAt.toISOString(),
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch enrollments." }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json() as { userId?: string; seriesId?: string };
    const { userId, seriesId } = body;

    if (!userId || !seriesId) {
      return NextResponse.json({ error: "userId and seriesId are required." }, { status: 400 });
    }

    // Verify the series exists and get its title
    const series = await prisma.series.findUnique({
      where: { id: seriesId },
      select: { title: true },
    });
    if (!series) return NextResponse.json({ error: "Series not found." }, { status: 404 });

    // Check for existing enrollment
    const existing = await prisma.enrollment.findUnique({
      where: { userId_seriesId: { userId, seriesId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Employee is already enrolled in this series." }, { status: 409 });
    }

    const enrollment = await prisma.enrollment.create({
      data: { userId, seriesId },
      include: { series: { select: { title: true } } },
    });

    const data: EnrollmentItem = {
      id:          enrollment.id,
      userId:      enrollment.userId,
      seriesId:    enrollment.seriesId,
      seriesTitle: enrollment.series.title,
      enrolledAt:  enrollment.createdAt.toISOString(),
    };

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to enroll employee." }, { status: 500 });
  }
}
