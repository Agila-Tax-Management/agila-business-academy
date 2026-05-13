// src/app/(backend)/api/notifications/read-all/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";

// PATCH /api/notifications/read-all
export async function PATCH(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.internalNotification.updateMany({
      where: { recipientId: session.user.id, readAt: null },
      data:  { readAt: new Date() },
    });

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}
