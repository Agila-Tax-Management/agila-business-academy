// src/app/(backend)/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    // TODO: real prisma update
    return NextResponse.json({ data: { id, ...body } });
  } catch {
    return NextResponse.json({ error: "Failed to update employee." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    // TODO: real prisma delete
    return NextResponse.json({ data: { id } });
  } catch {
    return NextResponse.json({ error: "Failed to delete employee." }, { status: 500 });
  }
}
