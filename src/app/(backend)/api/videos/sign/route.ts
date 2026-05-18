// src/app/(backend)/api/videos/sign/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import cloudinary from "@/lib/cloudinary";

// POST /api/videos/sign
// Returns a short-lived signed upload signature so the browser can upload
// a video or image file directly to Cloudinary without routing through this server.
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role } = session.user as { role?: string };
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let resourceType: string = "video";
  try {
    const body = await request.json() as { resourceType?: string };
    if (body.resourceType === "image") resourceType = "image";
  } catch { /* no body = default video */ }

  const timestamp = Math.round(Date.now() / 1000);
  const folder    = resourceType === "image" ? "agila-images" : "agila-videos";

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET!,
  );

  return NextResponse.json({
    data: {
      timestamp,
      signature,
      folder,
      resourceType,
      apiKey:    process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    },
  });
}
