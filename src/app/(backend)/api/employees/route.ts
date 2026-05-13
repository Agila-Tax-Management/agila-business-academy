// src/app/(backend)/api/employees/route.ts
import { NextRequest, NextResponse } from "next/server";

export type EmployeeRole = "EMPLOYEE" | "ADMIN" | "SUPER_ADMIN";

export interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  enrolledSeries: number;
  completedSeries: number;
  lastLogin: string | null;
  createdAt: string;
}

const MOCK_EMPLOYEES: EmployeeItem[] = [
  { id: "emp1", name: "Juan dela Cruz",  email: "juan@agila.ph",   role: "EMPLOYEE",   enrolledSeries: 2, completedSeries: 1, lastLogin: "2026-05-07T09:00:00Z", createdAt: "2026-01-15T08:00:00Z" },
  { id: "emp2", name: "Maria Santos",    email: "maria@agila.ph",  role: "EMPLOYEE",   enrolledSeries: 3, completedSeries: 0, lastLogin: "2026-05-06T15:30:00Z", createdAt: "2026-02-01T08:00:00Z" },
  { id: "emp3", name: "Carlo Reyes",     email: "carlo@agila.ph",  role: "EMPLOYEE",   enrolledSeries: 1, completedSeries: 1, lastLogin: "2026-05-05T10:00:00Z", createdAt: "2026-02-14T08:00:00Z" },
  { id: "emp4", name: "Ana Villanueva",  email: "ana@agila.ph",    role: "EMPLOYEE",   enrolledSeries: 2, completedSeries: 2, lastLogin: "2026-05-07T11:00:00Z", createdAt: "2026-03-01T08:00:00Z" },
  { id: "emp5", name: "Ramon Espiritu", email: "ramon@agila.ph",  role: "EMPLOYEE",   enrolledSeries: 0, completedSeries: 0, lastLogin: null,                   createdAt: "2026-04-10T08:00:00Z" },
  { id: "adm1", name: "Admin User",      email: "admin@agila.ph",  role: "ADMIN",      enrolledSeries: 0, completedSeries: 0, lastLogin: "2026-05-07T08:00:00Z", createdAt: "2026-01-01T08:00:00Z" },
];

export async function GET(_request: NextRequest): Promise<NextResponse> {
  // TODO: replace with real Prisma query after auth guard
  // const session = await auth.api.getSession({ headers: await headers() });
  // if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // const users = await prisma.user.findMany({ include: { _count: { select: { enrollments: true, seriesCompletions: true } } } });
  return NextResponse.json({ data: MOCK_EMPLOYEES });
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
