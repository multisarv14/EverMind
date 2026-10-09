import { currentSession } from "@/lib/auth";
import { json, unauthorized } from "@/lib/http";
import { aiConfig } from "@/lib/llm";

export async function GET() {
  if (!(await currentSession())) return unauthorized();

  const ai = await aiConfig();
  return json({
    aiConfigured: Boolean(ai),
    provider: ai?.provider ?? null,
    model: ai?.model ?? null,
  });
}
