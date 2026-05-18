// src/app/(backend)/api/admin/overview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/admin/overview — aggregate stats for the admin dashboard
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const [
      totalSeries,
      totalModules,
      totalVideos,
      totalEmployees,
      totalExams,
      totalAttempts,
      passedAttempts,
      recentAttemptRows,
    ] = await Promise.all([
      prisma.series.count(),
      prisma.module.count(),
      prisma.video.count(),
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.exam.count(),
      prisma.examAttempt.count(),
      prisma.examAttempt.count({ where: { passed: true } }),
      prisma.examAttempt.findMany({
        take:    10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
          exam: { select: { title: true } },
        },
      }),
    ]);

    const passRate = totalAttempts > 0
      ? Math.round((passedAttempts / totalAttempts) * 100)
      : 0;

    const recentAttempts = recentAttemptRows.map((a) => ({
      id:           a.id,
      employeeName: a.user.name,
      examTitle:    a.exam.title,
      score:        a.score,
      passed:       a.passed,
      submittedAt:  (a.submittedAt ?? a.createdAt).toISOString(),
    }));

    return NextResponse.json({
      data: {
        stats: {
          totalSeries,
          totalModules,
          totalVideos,
          totalEmployees,
          totalExams,
          totalAttempts,
          passRate,
        },
        recentAttempts,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch overview data." }, { status: 500 });
  }
}
