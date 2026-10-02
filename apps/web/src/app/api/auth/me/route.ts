import { currentSession } from "@/lib/auth";
import { buildMe } from "@/lib/me";
import { json, unauthorized } from "@/lib/http";

export async function GET() {
  const session = await currentSession();
  if (!session) return unauthorized();
  return json(await buildMe(session));
}
