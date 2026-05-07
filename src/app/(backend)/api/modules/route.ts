// src/app/(backend)/api/modules/route.ts
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Mock data — replace body of GET with real Prisma queries once DB is ready
// ---------------------------------------------------------------------------
const MOCK_MODULES = [
  {
    id: "seed-mod-orientation",
    seriesId: "seed-series-onboarding",
    seriesTitle: "New Employee Onboarding",
    title: "Company Orientation",
    description: "Overview of Agila's history, mission, and organisational structure.",
    order: 1,
    videoCount: 2,
  },
  {
    id: "seed-mod-hr",
    seriesId: "seed-series-onboarding",
    seriesTitle: "New Employee Onboarding",
    title: "HR Policies & Benefits",
    description: "Leave policies, benefits, code of conduct, and disciplinary guidelines.",
    order: 2,
    videoCount: 2,
  },
  {
    id: "seed-mod-safety",
    seriesId: "seed-series-safety",
    seriesTitle: "Safety & Compliance",
    title: "Workplace Safety Basics",
    description: "Hazard identification, PPE usage, and emergency evacuation procedures.",
    order: 1,
    videoCount: 2,
  },
  {
    id: "seed-mod-emergency",
    seriesId: "seed-series-safety",
    seriesTitle: "Safety & Compliance",
    title: "Emergency Response",
    description: "Fire drills, first aid essentials, and incident reporting.",
    order: 2,
    videoCount: 2,
  },
  {
    id: "seed-mod-atms",
    seriesId: "seed-series-it",
    seriesTitle: "IT & Systems Basics",
    title: "ATMS Overview",
    description: "Introduction to the internal ERP system used at Agila.",
    order: 1,
    videoCount: 1,
  },
];

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ data: MOCK_MODULES });
}
