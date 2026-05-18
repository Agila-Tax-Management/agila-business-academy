// src/app/(backend)/api/admin/certificate-settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export interface SignatoryItem {
  id:       string;
  name:     string;
  position: string;
  order:    number;
}

export interface AdminUserItem {
  id:       string;
  name:     string;
  position: string | null;
  role:     "ADMIN" | "SUPER_ADMIN";
}

const createSchema = z.object({
  name:     z.string().min(1).max(100),
  position: z.string().min(1).max(100),
  order:    z.number().int().min(0).optional(),
});

function isAdmin(role: string | null | undefined) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

// GET /api/admin/certificate-settings — list signatories + admin users (admin only)
export async function GET(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    let signatories = await prisma.certificateSignatory.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    // Auto-seed from SUPER_ADMIN users when no signatories have been configured yet
    if (signatories.length === 0) {
      const superAdmins = await prisma.user.findMany({
        where:  { role: "SUPER_ADMIN" },
        select: { name: true, position: true },
      });
      if (superAdmins.length > 0) {
        await prisma.certificateSignatory.createMany({
          data: superAdmins.map((u, i) => ({
            name:     u.name,
            position: u.position ?? "Administrator",
            order:    i,
          })),
        });
        signatories = await prisma.certificateSignatory.findMany({
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        });
      }
    }

    const adminUsers = await prisma.user.findMany({
      where:   { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select:  { id: true, name: true, position: true, role: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      data: {
        signatories,
        adminUsers: adminUsers.map((u) => ({
          id:       u.id,
          name:     u.name,
          position: u.position,
          role:     u.role as "ADMIN" | "SUPER_ADMIN",
        })),
      },
    });
  } catch (err) {
    console.error("[/api/admin/certificate-settings GET]", err);
    return NextResponse.json({ error: "Failed to fetch signatories" }, { status: 500 });
  }
}

// POST /api/admin/certificate-settings — create a signatory (admin only)
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const count = await prisma.certificateSignatory.count();
    const signatory = await prisma.certificateSignatory.create({
      data: {
        name:     parsed.data.name,
        position: parsed.data.position,
        order:    parsed.data.order ?? count,
      },
    });
    return NextResponse.json({ data: { signatory } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create signatory" }, { status: 500 });
  }
}
