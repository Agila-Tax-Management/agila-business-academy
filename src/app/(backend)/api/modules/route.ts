// src/app/(backend)/api/modules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const modules = await prisma.module.findMany({
      orderBy: [{ series: { order: "asc" } }, { order: "asc" }],
      include: {
        series: { select: { title: true } },
        _count: { select: { videos: true } },
      },
    });

    const data = modules.map((mod) => ({
      id:          mod.id,
      seriesId:    mod.seriesId,
      seriesTitle: mod.series.title,
      title:       mod.title,
      description: mod.description ?? null,
      order:       mod.order,
      videoCount:  mod._count.videos,
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch modules." }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json() as {
      seriesId?: string;
      title?: string;
      description?: string;
    };

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Module title is required." }, { status: 400 });
    }
    if (!body.seriesId?.trim()) {
      return NextResponse.json({ error: "Series ID is required." }, { status: 400 });
    }

    const series = await prisma.series.findUnique({
      where: { id: body.seriesId },
      select: { id: true, title: true },
    });
    if (!series) return NextResponse.json({ error: "Series not found." }, { status: 404 });

    const lastModule = await prisma.module.findFirst({
      where: { seriesId: body.seriesId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const mod = await prisma.module.create({
      data: {
        seriesId:    body.seriesId,
        title:       body.title.trim(),
        description: body.description?.trim() || null,
        order:       (lastModule?.order ?? 0) + 1,
      },
    });

    return NextResponse.json({
      data: {
        id:          mod.id,
        seriesId:    mod.seriesId,
        seriesTitle: series.title,
        title:       mod.title,
        description: mod.description ?? null,
        order:       mod.order,
        videoCount:  0,
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create module." }, { status: 500 });
  }
}
