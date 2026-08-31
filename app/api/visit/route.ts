import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Public first-party visit beacon. No auth — it logs anonymous pageviews.
// Never returns an error to the client: bad input aside, everything is 204.

function parseDevice(ua: string): string {
  return /Mobi|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";
}

function parseBrowser(ua: string): string {
  if (/Edg/.test(ua)) return "Edge";
  if (/OPR|Opera/.test(ua)) return "Opera";
  if (/SamsungBrowser/.test(ua)) return "Samsung";
  if (/Chrome/.test(ua)) return "Chrome";
  if (/Safari/.test(ua)) return "Safari";
  if (/Firefox/.test(ua)) return "Firefox";
  return "other";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      path?: unknown;
      referrer?: unknown;
    };

    const path = body.path;
    if (typeof path !== "string" || !path.startsWith("/")) {
      return new NextResponse(null, { status: 400 });
    }
    if (path.startsWith("/admin") || path.startsWith("/api")) {
      return new NextResponse(null, { status: 204 });
    }

    const ua = request.headers.get("user-agent") ?? "";
    if (/bot|crawl|spider|slurp|bingpreview|headless/i.test(ua)) {
      return new NextResponse(null, { status: 204 });
    }

    const rawCity = request.headers.get("x-vercel-ip-city");
    let city: string | null = null;
    if (rawCity) {
      try {
        city = decodeURIComponent(rawCity);
      } catch {
        city = rawCity;
      }
    }

    // Flags the owner's own visits (admin session cookie present).
    // Unauthenticated visitors are logged too — never rejected.
    const isMe = await requireAuth().catch(() => false);

    const { error } = await supabaseAdmin.from("visits").insert({
      path,
      referrer: typeof body.referrer === "string" && body.referrer ? body.referrer : null,
      country: request.headers.get("x-vercel-ip-country"),
      city,
      device: parseDevice(ua),
      browser: parseBrowser(ua),
      is_me: isMe,
    });
    if (error) console.error("visit insert failed:", error.message);
  } catch (err) {
    console.error("visit beacon error:", err);
  }
  return new NextResponse(null, { status: 204 });
}
