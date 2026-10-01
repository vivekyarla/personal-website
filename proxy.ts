import { NextResponse, type NextRequest } from "next/server";

// Cross-site request guard for the API (defense in depth on top of the
// SameSite=Lax session cookie): a state-changing request whose browser says
// it came from another site is refused. Non-browser callers (the iPhone
// Shortcut, Instinct's bearer-token requests) send no Origin and pass.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function proxy(request: NextRequest) {
  if (SAFE_METHODS.has(request.method)) return NextResponse.next();

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const fetchSite = request.headers.get("sec-fetch-site");

  let crossOrigin = fetchSite === "cross-site";
  if (origin && host) {
    try {
      crossOrigin ||= new URL(origin).host !== host;
    } catch {
      crossOrigin = true; // "null" or malformed Origin
    }
  }
  if (crossOrigin) {
    return NextResponse.json({ error: "cross-site request" }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
