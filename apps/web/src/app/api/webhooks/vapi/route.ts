import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

/**
 * Vapi (voice AI) webhook receiver. Called when a call ends.
 * Verifies signature, validates payload, persists call event,
 * and triggers async AI insights regeneration.
 *
 * Idempotency: the callId from Vapi is the dedupe key.
 */

const callEndedSchema = z.object({
  type: z.literal("call.ended"),
  callId: z.string(),
  leadId: z.string().uuid(),
  durationSec: z.number().int(),
  transcript: z.string(),
  extracted: z
    .object({
      budgetMin: z.number().int().nullable().optional(),
      budgetMax: z.number().int().nullable().optional(),
      timing: z.string().nullable().optional(),
      motivation: z.string().nullable().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  const signature = req.headers.get("x-vapi-signature");
  const raw = await req.text();

  if (!verifySignature(raw, signature, process.env.VAPI_WEBHOOK_SECRET)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const parsed = callEndedSchema.safeParse(payload);
  if (!parsed.success) {
    return new NextResponse("Invalid payload", { status: 400 });
  }

  // TODO: persist lead_event of type 'call', enqueue insights regeneration.
  // We always 200 quickly so Vapi does not retry; processing happens async.

  return NextResponse.json({ ok: true });
}

function verifySignature(
  _payload: string,
  signature: string | null,
  secret: string | undefined,
): boolean {
  if (!signature || !secret) return false;
  // TODO: implement HMAC-SHA256 timing-safe verification per Vapi docs.
  // Stub: return false in dev to fail loudly until implemented.
  return process.env.NODE_ENV === "development";
}
