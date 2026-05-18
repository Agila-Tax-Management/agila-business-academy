// src/app/(backend)/api/notifications/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PATCH /api/notifications/[id] — mark a single notification as read
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const notification = await prisma.internalNotification.findUnique({
      where: { id },
      select: { id: true, recipientId: true, readAt: true },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    // Users may only mark their own notifications as read
    if (notification.recipientId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // No-op if already read
    if (notification.readAt !== null) {
      return NextResponse.json({ data: { id } });
    }

    await prisma.internalNotification.update({
      where: { id },
      data:  { readAt: new Date() },
    });

    return NextResponse.json({ data: { id } });
  } catch {
    return NextResponse.json({ error: "Failed to mark notification as read." }, { status: 500 });
  }
}
