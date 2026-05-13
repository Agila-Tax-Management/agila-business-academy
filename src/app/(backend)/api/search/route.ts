// src/app/(backend)/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";

// GET /api/search?q=keyword
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ data: [] });

  try {
    const [seriesResults, moduleResults, videoResults] = await Promise.all([
      prisma.series.findMany({
        where: {
          title: { contains: q, mode: "insensitive" },
          OR: [
            { isPublic: true },
            { enrollments: { some: { userId: session.user.id } } },
          ],
        },
        take: 10,
        select: { id: true, title: true, description: true },
      }),

      prisma.module.findMany({
        where: {
          title: { contains: q, mode: "insensitive" },
          series: {
            OR: [
              { isPublic: true },
              { enrollments: { some: { userId: session.user.id } } },
            ],
          },
        },
        take: 10,
        select: { id: true, title: true, description: true, seriesId: true, series: { select: { title: true } } },
      }),

      prisma.video.findMany({
        where: {
          title: { contains: q, mode: "insensitive" },
          module: {
            series: {
              OR: [
                { isPublic: true },
                { enrollments: { some: { userId: session.user.id } } },
              ],
            },
          },
        },
        take: 10,
        select: { id: true, title: true, description: true, module: { select: { id: true, title: true, seriesId: true } } },
      }),
    ]);

    const results = [
      ...seriesResults.map((s) => ({
        id:          s.id,
        type:        "series" as const,
        title:       s.title,
        description: s.description,
      })),
      ...moduleResults.map((m) => ({
        id:          m.id,
        type:        "module" as const,
        title:       m.title,
        description: m.description,
        parentTitle: m.series.title,
        seriesId:    m.seriesId,
      })),
      ...videoResults.map((v) => ({
        id:          v.id,
        type:        "video" as const,
        title:       v.title,
        description: v.description,
        parentTitle: v.module.title,
        seriesId:    v.module.seriesId,
        moduleId:    v.module.id,
      })),
    ];

    return NextResponse.json({ data: results });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
