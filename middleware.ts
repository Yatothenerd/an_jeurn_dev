import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight JWT payload extraction — no crypto, safe for Edge Runtime.
// Signature verification happens in API routes and server components via verifyJWT().
function extractPayload(token: string): { role: string; exp?: number } | null {
  try {
    const [, b64] = token.split(".");
    if (!b64) return null;
    // base64url → base64
    const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    const payload = JSON.parse(json) as { role?: string; exp?: number };
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    if (!payload.role) return null;
    return payload as { role: string; exp?: number };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;
  const payload = token ? extractPayload(token) : null;

  // /admin — admin role only
  if (pathname.startsWith("/admin")) {
    if (!payload || payload.role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // /dashboard — client role only (active package checked in layout)
  if (pathname.startsWith("/dashboard")) {
    if (!payload || payload.role !== "client") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect authenticated users away from login
  if (pathname === "/login" && payload) {
    const dest = payload.role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/login"],
};
