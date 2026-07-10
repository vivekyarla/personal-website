import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Approximate visitor coordinates from Vercel's IP-geolocation headers.
// No browser permission prompt needed; used for the sunset dark-mode check.
export async function GET(request: Request) {
  const lat = request.headers.get("x-vercel-ip-latitude");
  const lon = request.headers.get("x-vercel-ip-longitude");
  return NextResponse.json({
    lat: lat != null ? parseFloat(lat) : null,
    lon: lon != null ? parseFloat(lon) : null,
  });
}
