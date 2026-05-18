// src/app/(backend)/api/employees/[id]/password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@better-auth/utils/password";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const body = await request.json() as unknown;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const hashed = await hashPassword(parsed.data.password);

    const updated = await prisma.account.updateMany({
      where: { userId: id, providerId: "credential" },
      data:  { password: hashed },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "User not found or has no password account." }, { status: 404 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
  }
}
