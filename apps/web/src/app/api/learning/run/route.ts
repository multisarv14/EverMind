import { currentSession } from "@/lib/auth";
import { aiErrorResponse } from "@/lib/ai";
import { runLearning } from "@/lib/learning";
import { canEdit, forbidden, json, unauthorized } from "@/lib/http";

// "Learn from recent conversations now" instead of waiting for the nightly run.
export async function POST() {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  try {
    return json(await runLearning(session.company));
  } catch (error) {
    return aiErrorResponse(error) ?? json({ error: "Something went wrong." }, 500);
  }
}
