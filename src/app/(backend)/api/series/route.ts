// src/app/(backend)/api/series/route.ts
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Mock data — replace body of GET with real Prisma queries once DB is ready
// ---------------------------------------------------------------------------
const MOCK_SERIES = [
  {
    id: "seed-series-onboarding",
    title: "New Employee Onboarding",
    description:
      "Everything a new Agila employee needs to know — company culture, policies, and tools.",
    thumbnailUrl: null,
    totalModules: 2,
    totalVideos: 4,
    progress: 35,
    isEnrolled: true,
    isPublic: true,
    // Admin fields
    requiresCertificate: true,
    moduleCount: 2,
    videoCount: 4,
  },
  {
    id: "seed-series-safety",
    title: "Safety & Compliance",
    description:
      "Workplace safety standards, emergency procedures, and regulatory compliance training.",
    thumbnailUrl: null,
    totalModules: 2,
    totalVideos: 4,
    progress: 0,
    isEnrolled: true,
    isPublic: true,
    requiresCertificate: true,
    moduleCount: 2,
    videoCount: 4,
  },
  {
    id: "seed-series-it",
    title: "IT & Systems Basics",
    description:
      "Introduction to the tools and systems used across the organisation.",
    thumbnailUrl: null,
    totalModules: 1,
    totalVideos: 1,
    progress: 100,
    isEnrolled: true,
    isPublic: false,
    requiresCertificate: false,
    moduleCount: 1,
    videoCount: 1,
  },
  {
    id: "seed-series-leadership",
    title: "Leadership Fundamentals",
    description:
      "Core leadership skills for team leads and aspiring managers at Agila.",
    thumbnailUrl: null,
    totalModules: 3,
    totalVideos: 9,
    progress: 0,
    isEnrolled: false,
    isPublic: true,
    requiresCertificate: true,
    moduleCount: 3,
    videoCount: 9,
  },
  {
    id: "seed-series-customer",
    title: "Customer Service Excellence",
    description:
      "Delivering outstanding service to Agila clients — communication, handling complaints, and building trust.",
    thumbnailUrl: null,
    totalModules: 2,
    totalVideos: 6,
    progress: 0,
    isEnrolled: false,
    isPublic: true,
    requiresCertificate: false,
    moduleCount: 2,
    videoCount: 6,
  },
];

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ data: MOCK_SERIES });
}
