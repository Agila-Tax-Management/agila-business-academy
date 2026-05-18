// src/app/(backend)/api/exams/[id]/questions/[questionId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { questionId } = await params;
    await prisma.question.delete({ where: { id: questionId } });
    return NextResponse.json({ data: { id: questionId } });
  } catch {
    return NextResponse.json({ error: "Failed to delete question." }, { status: 500 });
  }
}
