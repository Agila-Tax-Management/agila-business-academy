// src/app/(backend)/api/employees/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type EmployeeRole = "EMPLOYEE" | "ADMIN" | "SUPER_ADMIN";
export type EmployeeApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
  position: string | null;
  role: EmployeeRole;
  approvalStatus: EmployeeApprovalStatus;
  enrolledSeries: number;
  completedSeries: number;
  lastLogin: string | null;
  createdAt: string;
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { enrollments: true, seriesCompletions: true } },
        sessions: { orderBy: { updatedAt: "desc" }, take: 1, select: { updatedAt: true } },
      },
    });

    const data: EmployeeItem[] = users.map((u) => ({
      id:              u.id,
      name:            u.name,
      email:           u.email,
      image:           u.image ?? null,
      position:        u.position ?? null,
      role:            u.role as EmployeeRole,
      approvalStatus:  u.approvalStatus as EmployeeApprovalStatus,
      enrolledSeries:  u._count.enrollments,
      completedSeries: u._count.seriesCompletions,
      lastLogin:       u.sessions[0]?.updatedAt.toISOString() ?? null,
      createdAt:       u.createdAt.toISOString(),
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch employees." }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { name?: string; email?: string; role?: EmployeeRole };
    const { name, email, role } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const newEmployee: EmployeeItem = {
      id:              crypto.randomUUID(),
      name:            name.trim(),
      email:           email.trim().toLowerCase(),
      image:           null,
      position:        null,
      role:            role ?? "EMPLOYEE",
      enrolledSeries:  0,
      completedSeries: 0,
      lastLogin:       null,
      createdAt:       new Date().toISOString(),
    };

    // TODO: create user record in DB via BetterAuth + prisma
    return NextResponse.json({ data: newEmployee }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create employee." }, { status: 500 });
  }
}
