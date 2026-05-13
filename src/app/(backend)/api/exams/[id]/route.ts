// src/app/(backend)/api/exams/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    // TODO: real prisma.exam.update
    return NextResponse.json({ data: { id, ...body } });
  } catch {
    return NextResponse.json({ error: "Failed to update exam." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    // TODO: real prisma.exam.delete
    return NextResponse.json({ data: { id } });
  } catch {
    return NextResponse.json({ error: "Failed to delete exam." }, { status: 500 });
  }
}
