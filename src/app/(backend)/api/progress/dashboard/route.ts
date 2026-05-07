// src/app/(backend)/api/progress/dashboard/route.ts
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Mock data — replace body of GET with real Prisma queries once DB is ready
// The shape matches EnrolledSeries in (learner)/dashboard/page.tsx
// ---------------------------------------------------------------------------
const MOCK_DASHBOARD = [
  {
    id: "seed-series-onboarding",
    title: "New Employee Onboarding",
    thumbnailUrl: null,
    progress: 35,
    totalModules: 2,
    completedModules: 0,
    lastWatchedAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(), // 16 hrs ago
    hasPendingExam: true,
  },
  {
    id: "seed-series-safety",
    title: "Safety & Compliance",
    thumbnailUrl: null,
    progress: 0,
    totalModules: 2,
    completedModules: 0,
    lastWatchedAt: null,
    hasPendingExam: false,
  },
  {
    id: "seed-series-it",
    title: "IT & Systems Basics",
    thumbnailUrl: null,
    progress: 100,
    totalModules: 1,
    completedModules: 1,
    lastWatchedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), // 6 days ago
    hasPendingExam: false,
  },
];

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ data: MOCK_DASHBOARD });
}
