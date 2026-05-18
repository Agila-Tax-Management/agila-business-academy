// src/app/(backend)/api/employees/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApprovalStatus, NotificationType, NotificationPriority } from "@/generated/prisma";

const bodySchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
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

  const { id } = await params;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { action } = parsed.data;
  const newStatus = action === "APPROVE" ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;

  try {
    const employee = await prisma.user.update({
      where: { id },
      data: { approvalStatus: newStatus },
      select: { id: true, name: true, email: true },
    });

    // Notify the employee of the decision
    void prisma.internalNotification.create({
      data: {
        recipientId: id,
        type: action === "APPROVE" ? NotificationType.SUCCESS : NotificationType.ERROR,
        priority: NotificationPriority.HIGH,
        title: action === "APPROVE" ? "Account approved!" : "Account access declined",
        message:
          action === "APPROVE"
            ? "Your account has been approved. You can now access Agila Business Academy."
            : "Your access request has been declined. Please contact your HR officer for assistance.",
        entity: "User",
        entityId: id,
        actionUrl: action === "APPROVE" ? "/dashboard" : null,
      },
    }).catch(() => null);

    return NextResponse.json({ data: { id: employee.id, name: employee.name, approvalStatus: newStatus } });
  } catch {
    return NextResponse.json({ error: "Failed to update approval status." }, { status: 500 });
  }
}

