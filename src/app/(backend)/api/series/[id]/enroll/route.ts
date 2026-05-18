// src/app/(backend)/api/series/[id]/enroll/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";

// POST /api/series/[id]/enroll — enroll the current user in a series
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const series = await prisma.series.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!series) return NextResponse.json({ error: "Series not found" }, { status: 404 });

    const enrollment = await prisma.enrollment.upsert({
      where: { userId_seriesId: { userId: session.user.id, seriesId: id } },
      create: { userId: session.user.id, seriesId: id },
      update: {},
    });

    return NextResponse.json({ data: enrollment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
  }
}
