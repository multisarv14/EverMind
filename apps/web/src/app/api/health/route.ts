import { aiSettings } from "@/lib/db";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

// For load balancers and uptime monitors. Public, reveals nothing except "up" or "down".
export async function GET() {
  try {
    await aiSettings().doc("ai").get();
    return json({ ok: true });
  } catch {
    return json({ ok: false }, 503);
  }
}
