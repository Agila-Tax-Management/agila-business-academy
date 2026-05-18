// src/app/(backend)/api/certificates/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface SignatoryData {
  id:       string;
  name:     string;
  position: string;
  order:    number;
}

export interface CertificateItem {
  id:           string;
  seriesId:     string;
  seriesTitle:  string;
  issuedAt:     string;
  credentialId: string;
  fileUrl:      string | null;
}

export interface CertificatesResponse {
  certificates: CertificateItem[];
  signatories:  SignatoryData[];
}

// GET /api/certificates — list the current user's earned certificates + signatories
export async function GET(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [certs, rawSignatories] = await Promise.all([
      prisma.certificate.findMany({
        where:   { userId: session.user.id },
        orderBy: { issuedAt: "desc" },
      }),
      prisma.certificateSignatory.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      }),
    ]);

    // Auto-seed from SUPER_ADMIN users if no signatories have been configured yet
    let signatories = rawSignatories;
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

    // Batch-fetch series titles (seriesId is a plain string field, no Prisma relation)
    const seriesIds = [...new Set(certs.map((c) => c.seriesId))];
    const seriesList = seriesIds.length
      ? await prisma.series.findMany({
          where:  { id: { in: seriesIds } },
          select: { id: true, title: true },
        })
      : [];
    const seriesMap = Object.fromEntries(seriesList.map((s) => [s.id, s.title]));

    const certificates: CertificateItem[] = certs.map((c) => ({
      id:           c.id,
      seriesId:     c.seriesId,
      seriesTitle:  seriesMap[c.seriesId] ?? "Unknown Series",
      issuedAt:     c.issuedAt.toISOString(),
      credentialId: `ABA-${c.issuedAt.getFullYear()}-${c.id.slice(-8).toUpperCase()}`,
      fileUrl:      c.fileUrl ?? null,
    }));

    const data: CertificatesResponse = {
      certificates,
      signatories: signatories.map((s) => ({
        id:       s.id,
        name:     s.name,
        position: s.position,
        order:    s.order,
      })),
    };

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[/api/certificates]", err);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}
