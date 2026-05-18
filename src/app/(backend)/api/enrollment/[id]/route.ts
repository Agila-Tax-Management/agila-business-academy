// src/app/(backend)/api/enrollment/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;

    const enrollment = await prisma.enrollment.findUnique({ where: { id } });
    if (!enrollment) return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });

    await prisma.enrollment.delete({ where: { id } });
    return NextResponse.json({ data: { id } });
  } catch {
    return NextResponse.json({ error: "Failed to remove enrollment." }, { status: 500 });
  }
}
