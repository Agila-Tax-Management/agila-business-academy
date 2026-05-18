// src/app/(backend)/api/admin/admins/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { Role, ApprovalStatus } from "@/generated/prisma";

export interface AdminUserRow {
  id:        string;
  name:      string;
  email:     string;
  image:     string | null;
  position:  string | null;
  role:      "ADMIN" | "SUPER_ADMIN";
  createdAt: string;
}

const createAdminSchema = z.object({
  name:     z.string().min(1, "Name is required").max(100).trim(),
  email:    z.string().email("Invalid email").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  position: z.string().max(100).trim().optional(),
  role:     z.enum(["ADMIN", "SUPER_ADMIN"]),
});

// GET /api/admin/admins — list all admin + super_admin users
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, image: true, position: true, role: true, createdAt: true },
    });

    const data: AdminUserRow[] = users.map((u) => ({
      id:        u.id,
      name:      u.name,
      email:     u.email,
      image:     u.image ?? null,
      position:  u.position ?? null,
      role:      u.role as "ADMIN" | "SUPER_ADMIN",
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch admin users." }, { status: 500 });
  }
}

// POST /api/admin/admins — create a new admin or super admin user
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only super admins can create admin accounts." }, { status: 403 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { name, email, password, position, role } = parsed.data;

  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  try {
    // Use BetterAuth to create the user (handles password hashing)
    const result = await auth.api.signUpEmail({
      body: { email, password, name },
    });

    const userId = (result as unknown as { user?: { id: string }; id?: string })?.user?.id
      ?? (result as unknown as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
    }

    // Promote to requested role and mark as approved
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        role:           Role[role],
        approvalStatus: ApprovalStatus.APPROVED,
        position:       position?.trim() || null,
      },
      select: { id: true, name: true, email: true, image: true, position: true, role: true, createdAt: true },
    });

    const data: AdminUserRow = {
      id:        user.id,
      name:      user.name,
      email:     user.email,
      image:     user.image ?? null,
      position:  user.position ?? null,
      role:      user.role as "ADMIN" | "SUPER_ADMIN",
      createdAt: user.createdAt.toISOString(),
    };

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create admin account." }, { status: 500 });
  }
}
