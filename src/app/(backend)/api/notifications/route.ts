// src/app/(backend)/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";

// GET /api/notifications?limit=10
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10),
    50,
  );

  try {
    const notifications = await prisma.internalNotification.findMany({
      where:   { recipientId: session.user.id },
      orderBy: { createdAt: "desc" },
      take:    limit,
    });

    const unreadCount = await prisma.internalNotification.count({
      where: { recipientId: session.user.id, readAt: null },
    });

    return NextResponse.json({
      data: {
        notifications: notifications.map((n) => ({
          id:        n.id,
          type:      n.type,
          priority:  n.priority,
          title:     n.title,
          message:   n.message,
          entity:    n.entity ?? null,
          entityId:  n.entityId ?? null,
          actionUrl: n.actionUrl ?? null,
          isRead:    n.readAt !== null,
          readAt:    n.readAt?.toISOString() ?? null,
          createdAt: n.createdAt.toISOString(),
        })),
        unreadCount,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
