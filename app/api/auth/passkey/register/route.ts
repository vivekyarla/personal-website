import { NextResponse } from "next/server";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { getSession, requireAuth, requireRecovery } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ADMIN_USER_ID, ADMIN_USER_NAME, ORIGIN, RP_ID, RP_NAME } from "@/lib/passkey";

// Enrolling needs an admin sign-in (existing passkey) or, to recover from a
// lost device, a fresh recovery-code sign-in (/admin/recover).
async function mayEnroll() {
  return (await requireAuth()) || (await requireRecovery());
}

// GET → registration options.
export async function GET() {
  if (!(await mayEnroll())) {
    return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
  }

  const { data: existing } = await supabaseAdmin
    .from("admin_credentials")
    .select("credential_id, transports");

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: new TextEncoder().encode(ADMIN_USER_ID),
    userName: ADMIN_USER_NAME,
    attestationType: "none",
    excludeCredentials: (existing ?? []).map((c) => ({
      id: c.credential_id,
      transports: (c.transports as AuthenticatorTransport[] | null) ?? undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      // Face ID / Touch ID (or a device PIN) required.
      userVerification: "required",
    },
  });

  const session = await getSession();
  session.webauthnChallenge = options.challenge;
  await session.save();
  return NextResponse.json(options);
}

// POST → verify and store the new credential
export async function POST(request: Request) {
  if (!(await mayEnroll())) {
    return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
  }

  const session = await getSession();
  const expectedChallenge = session.webauthnChallenge;
  if (!expectedChallenge) {
    return NextResponse.json({ ok: false, error: "no challenge" }, { status: 400 });
  }

  const body = (await request.json()) as {
    response: RegistrationResponseJSON;
    label?: string;
  };

  const verification = await verifyRegistrationResponse({
    response: body.response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    requireUserVerification: true,
  }).catch(() => null);

  if (!verification?.verified || !verification.registrationInfo) {
    return NextResponse.json({ ok: false, error: "verify failed" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;

  const { error } = await supabaseAdmin.from("admin_credentials").insert({
    credential_id: credential.id,
    public_key: Buffer.from(credential.publicKey).toString("base64"),
    counter: credential.counter,
    transports: credential.transports ?? null,
    device_label: body.label ?? null,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  session.webauthnChallenge = undefined;
  // A recovery sign-in is single-use: enroll, then sign in with the passkey.
  session.recoveryAt = undefined;
  await session.save();
  return NextResponse.json({ ok: true });
}
