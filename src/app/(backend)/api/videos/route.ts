// src/app/(backend)/api/videos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";
import { z } from "zod";

// GET /api/videos — returns all videos with module + series info
export async function GET(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const videos = await prisma.video.findMany({
      orderBy: [
        { module: { series: { order: "asc" } } },
        { module: { order: "asc" } },
        { order: "asc" },
      ],
      include: {
        module: { include: { series: true } },
      },
    });

    return NextResponse.json({
      data: videos.map((v) => ({
        id:              v.id,
        moduleId:        v.moduleId,
        moduleTitle:     v.module.title,
        seriesTitle:     v.module.series.title,
        title:           v.title,
        description:     v.description,
        durationSeconds: v.durationSeconds,
        order:           v.order,
        videoUrl:        v.videoUrl,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

// ── POST /api/videos ──────────────────────────────────────────────────────────
// Saves video metadata to DB after the client has uploaded the file directly to
// Cloudinary. Expects JSON body with the Cloudinary response fields.

const createVideoSchema = z.object({
  title:             z.string().min(1).max(255),
  description:       z.string().optional(),
  moduleId:          z.string().min(1),
  order:             z.number().int().min(1).default(1),
  videoUrl:          z.string().url(),
  cloudinaryPublicId: z.string().min(1),
  durationSeconds:   z.number().int().min(0).default(0),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role } = session.user as { role?: string };
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
  }

  const { title, description, moduleId, order, videoUrl, cloudinaryPublicId, durationSeconds } = parsed.data;

  try {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) return NextResponse.json({ error: "Module not found" }, { status: 404 });

    const video = await prisma.video.create({
      data: { title, description, moduleId, order, videoUrl, cloudinaryPublicId, durationSeconds },
    });

    return NextResponse.json({ data: video }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save video" }, { status: 500 });
  }
}

