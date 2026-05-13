// src/app/(backend)/api/exams/[id]/questions/[questionId]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> },
): Promise<NextResponse> {
  try {
    const { questionId } = await params;
    // TODO: real prisma.question.delete (cascades choices + answers)
    return NextResponse.json({ data: { id: questionId } });
  } catch {
    return NextResponse.json({ error: "Failed to delete question." }, { status: 500 });
  }
}
