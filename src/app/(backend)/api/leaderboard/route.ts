// src/app/(backend)/api/leaderboard/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";

// GET /api/leaderboard
export async function GET(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Aggregate each employee's completed series count and average exam score
    const users = await prisma.user.findMany({
      where: { role: { in: ["EMPLOYEE", "ADMIN", "SUPER_ADMIN"] } },
      select: {
        id:   true,
        name: true,
        seriesCompletions: { select: { id: true } },
        examAttempts: {
          where: { passed: true },
          select: { score: true },
        },
      },
    });

    const entries = users
      .map((u) => {
        const completedSeries = u.seriesCompletions.length;
        const attempts        = u.examAttempts;
        const avgScore        = attempts.length
          ? Math.round(attempts.reduce((a, e) => a + e.score, 0) / attempts.length)
          : null;
        // Simple points formula: 100 pts per completed series + avg score bonus
        const points = completedSeries * 100 + (avgScore ?? 0);
        return { userId: u.id, name: u.name, completedSeries, avgScore, points };
      })
      .sort((a, b) => b.points - a.points)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    return NextResponse.json({ data: entries });
  } catch {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
