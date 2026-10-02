import { currentSession } from "@/lib/auth";
import { json, unauthorized } from "@/lib/http";

export async function GET() {
  if (!(await currentSession())) return unauthorized();

  return json({
    aiConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    model: process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5",
  });
}
