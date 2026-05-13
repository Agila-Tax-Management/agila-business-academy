// src/app/(backend)/api/enrollment/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    // TODO: real prisma.enrollment.delete
    return NextResponse.json({ data: { id } });
  } catch {
    return NextResponse.json({ error: "Failed to remove enrollment." }, { status: 500 });
  }
}
