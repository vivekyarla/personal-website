import { NextResponse } from "next/server";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ORIGIN, RP_ID } from "@/lib/passkey";

// GET → authentication options
export async function GET() {
  const { data: creds } = await supabaseAdmin
    .from("admin_credentials")
    .select("credential_id, transports");

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "preferred",
    allowCredentials: (creds ?? []).map((c) => ({
      id: c.credential_id,
      transports: (c.transports as AuthenticatorTransport[] | null) ?? undefined,
    })),
  });

  const session = await getSession();
  session.webauthnChallenge = options.challenge;
  await session.save();
  return NextResponse.json(options);
}

// POST → verify and authenticate
export async function POST(request: Request) {
  const session = await getSession();
  const expectedChallenge = session.webauthnChallenge;
  if (!expectedChallenge) {
    return NextResponse.json({ ok: false, error: "no challenge" }, { status: 400 });
  }

  const body = (await request.json()) as { response: AuthenticationResponseJSON };
  const credentialId = body.response.id;

  const { data: row, error: fetchErr } = await supabaseAdmin
    .from("admin_credentials")
    .select("credential_id, public_key, counter, transports")
    .eq("credential_id", credentialId)
    .single();

  if (fetchErr || !row) {
    return NextResponse.json({ ok: false, error: "credential not found" }, { status: 404 });
  }

  const verification = await verifyAuthenticationResponse({
    response: body.response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    credential: {
      id: row.credential_id,
      publicKey: Buffer.from(row.public_key, "base64"),
      counter: Number(row.counter),
      transports: (row.transports as AuthenticatorTransport[] | null) ?? undefined,
    },
    requireUserVerification: false,
  });

  if (!verification.verified) {
    return NextResponse.json({ ok: false, error: "verify failed" }, { status: 400 });
  }

  await supabaseAdmin
    .from("admin_credentials")
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq("credential_id", credentialId);

  session.authed = true;
  session.webauthnChallenge = undefined;
  await session.save();
  return NextResponse.json({ ok: true });
}
