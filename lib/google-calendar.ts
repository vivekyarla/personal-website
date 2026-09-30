import "server-only";
import { createSign } from "node:crypto";

// Minimal read-only Google Calendar API client authenticated as a service
// account (GOOGLE_SERVICE_ACCOUNT_JSON = the full key file JSON). Each calendar
// must be shared with the service account's email ("See all event details").
// Scope is calendar.readonly — this can never modify the calendar.

type ServiceAccount = { client_email: string; private_key: string };

export type GcalItem = {
  id: string;
  iCalUID?: string;
  summary?: string;
  location?: string;
  status?: string;
  recurringEventId?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
};

function serviceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw) as ServiceAccount;
    if (!sa.client_email || !sa.private_key) return null;
    // Tolerate keys pasted with literal "\n" sequences.
    return { ...sa, private_key: sa.private_key.replace(/\\n/g, "\n") };
  } catch {
    console.error("[gcal] GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
    return null;
  }
}

export function googleApiConfigured(): boolean {
  return serviceAccount() !== null;
}

// Secret iCal address → calendar ID, e.g.
// https://calendar.google.com/calendar/ical/<id>/private-<hash>/basic.ics
export function calendarIdFromIcsUrl(url: string): string | null {
  const m = url.match(/calendar\.google\.com\/calendar\/ical\/([^/]+)\//);
  return m ? decodeURIComponent(m[1]) : null;
}

let tokenCache: { token: string; exp: number } | null = null;
let tokenPending: Promise<string> | null = null;

// Calendars are fetched in parallel — share one token request between them.
function accessToken(sa: ServiceAccount): Promise<string> {
  if (tokenCache && tokenCache.exp > Date.now() + 60_000)
    return Promise.resolve(tokenCache.token);
  tokenPending ??= requestToken(sa).finally(() => (tokenPending = null));
  return tokenPending;
}

async function requestToken(sa: ServiceAccount): Promise<string> {

  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const sig = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(sa.private_key)
    .toString("base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${sig}`,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`token ${res.status}: ${await res.text()}`);
  const { access_token, expires_in } = await res.json();
  tokenCache = { token: access_token, exp: Date.now() + expires_in * 1000 };
  return access_token;
}

// All event instances (recurrences expanded) overlapping [timeMin, timeMax).
// Throws if the calendar isn't readable with full details — callers fall back
// to the iCal feed.
export async function listEvents(
  calendarId: string,
  timeMin: Date,
  timeMax: Date
): Promise<GcalItem[]> {
  const sa = serviceAccount();
  if (!sa) throw new Error("service account not configured");
  const token = await accessToken(sa);

  const items: GcalItem[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
      fields:
        "accessRole,nextPageToken,items(id,iCalUID,summary,location,status,recurringEventId,start,end)",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!res.ok) throw new Error(`events ${res.status}: ${await res.text()}`);
    const body = await res.json();
    // Free/busy-only sharing hides titles — the iCal feed is better there.
    if (body.accessRole === "freeBusyReader")
      throw new Error("shared as free/busy only");
    items.push(...(body.items ?? []));
    pageToken = body.nextPageToken;
  } while (pageToken);

  return items.filter((i) => i.status !== "cancelled");
}
