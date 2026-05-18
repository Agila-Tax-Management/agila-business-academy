// src/app/(backend)/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";

const updateProfileSchema = z.object({
  name:     z.string().min(1, "Name is required").max(100).trim(),
  position: z.string().max(100).trim().optional(),
});

// PATCH /api/profile — update the current user's display name
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name:     parsed.data.name,
        ...(parsed.data.position !== undefined && { position: parsed.data.position }),
      },
      select: { id: true, name: true, image: true, position: true },
    });
    return NextResponse.json({ data: user });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
