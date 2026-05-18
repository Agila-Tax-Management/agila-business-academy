// src/app/(backend)/api/series/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  try {
    // Fetch all series with module/video counts and current user's enrollment
    const seriesList = await prisma.series.findMany({
      where: isAdmin
        ? undefined
        : {
            OR: [
              { isPublic: true },
              { enrollments: { some: { userId: session.user.id } } },
            ],
          },
      orderBy: { order: "asc" },
      include: {
        _count: { select: { modules: true } },
        modules: {
          select: {
            _count: { select: { videos: true } },
            videos: { select: { id: true } },
          },
        },
        enrollments: {
          where: { userId: session.user.id },
          select: { id: true },
          take: 1,
        },
      },
    });

    // Collect all video IDs across enrolled series to look up completion in one query
    const enrolledVideoIds = seriesList
      .filter((s) => s.enrollments.length > 0)
      .flatMap((s) => s.modules.flatMap((m) => m.videos.map((v) => v.id)));

    const completedSet = new Set<string>();
    if (enrolledVideoIds.length > 0) {
      const completedProgress = await prisma.videoProgress.findMany({
        where: {
          userId: session.user.id,
          videoId: { in: enrolledVideoIds },
          completedAt: { not: null },
        },
        select: { videoId: true },
      });
      completedProgress.forEach((p) => completedSet.add(p.videoId));
    }

    const data = seriesList.map((s) => {
      const totalModules = s._count.modules;
      const totalVideos  = s.modules.reduce((sum, m) => sum + m._count.videos, 0);
      const isEnrolled   = s.enrollments.length > 0;

      let progress = 0;
      if (isEnrolled && totalVideos > 0) {
        const seriesVideoIds  = s.modules.flatMap((m) => m.videos.map((v) => v.id));
        const completedCount  = seriesVideoIds.filter((id) => completedSet.has(id)).length;
        progress = Math.round((completedCount / totalVideos) * 100);
      }

      return {
        id:                 s.id,
        title:              s.title,
        description:        s.description ?? null,
        thumbnailUrl:       s.thumbnailUrl ?? null,
        totalModules,
        totalVideos,
        progress,
        isEnrolled,
        isPublic:           s.isPublic,
        requiresCertificate: s.requiresCertificate,
        moduleCount:        totalModules,
        videoCount:         totalVideos,
      };
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch series." }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json() as {
      title?: string;
      description?: string;
      isPublic?: boolean;
      requiresCertificate?: boolean;
    };

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Series title is required." }, { status: 400 });
    }

    const lastSeries = await prisma.series.findFirst({ orderBy: { order: "desc" }, select: { order: true } });

    const series = await prisma.series.create({
      data: {
        title:               body.title.trim(),
        description:         body.description?.trim() || null,
        isPublic:            body.isPublic ?? false,
        requiresCertificate: body.requiresCertificate ?? false,
        order:               (lastSeries?.order ?? 0) + 1,
      },
      include: { _count: { select: { modules: true } } },
    });

    return NextResponse.json({
      data: {
        id:                 series.id,
        title:              series.title,
        description:        series.description ?? null,
        isPublic:           series.isPublic,
        requiresCertificate: series.requiresCertificate,
        moduleCount:        series._count.modules,
        videoCount:         0,
        totalModules:       series._count.modules,
        totalVideos:        0,
        progress:           0,
        isEnrolled:         false,
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create series." }, { status: 500 });
  }
}
