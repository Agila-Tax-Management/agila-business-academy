// src/app/(backend)/api/admin/admins/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { Role } from "@/generated/prisma";

const patchSchema = z.object({
  role: z.enum(["ADMIN", "SUPER_ADMIN"]),
});

// PATCH /api/admin/admins/[id] — change role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only super admins can change admin roles." }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role: Role[parsed.data.role] },
      select: { id: true, name: true, email: true, image: true, position: true, role: true, createdAt: true },
    });
    return NextResponse.json({ data: user });
  } catch {
    return NextResponse.json({ error: "Failed to update role." }, { status: 500 });
  }
}

// DELETE /api/admin/admins/[id] — remove admin user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only super admins can remove admin accounts." }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ data: { id } });
  } catch {
    return NextResponse.json({ error: "Failed to delete admin account." }, { status: 500 });
  }
}
