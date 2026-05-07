// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = ["/sign-in", "/forgot-password", "/api/auth"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = getSessionCookie(request);

  // Redirect unauthenticated users to sign-in
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/library/:path*",
    "/learn/:path*",
    "/exam/:path*",
    "/progress/:path*",
    "/certificates/:path*",
    "/admin/:path*",
    "/profile/:path*",
  ],
};
