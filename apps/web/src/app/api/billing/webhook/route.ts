import { createHash } from "node:crypto";
import { json } from "@/lib/http";
import { handleWebhook, verifySignature, type WebhookEvent } from "@/lib/billing";

export const runtime = "nodejs";

// Razorpay calls this after payments and subscription changes. Public, but every call must be signed.
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-razorpay-signature"))) {
    return json({ error: "Invalid signature." }, 400);
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid body." }, 400);
  }

  // Razorpay sends a unique id per event; fall back to a hash of the body.
  const id = request.headers.get("x-razorpay-event-id") || createHash("sha256").update(raw).digest("hex");
  await handleWebhook(id, event);
  return json({ ok: true });
}
