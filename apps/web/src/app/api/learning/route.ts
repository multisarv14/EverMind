import { countOf, feedback, findAll, learnings } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { json, unauthorized } from "@/lib/http";

export async function GET() {
  const session = await currentSession();
  if (!session) return unauthorized();

  const companyId = session.company._id;
  const monthStart = new Date(new Date().toISOString().slice(0, 7) + "-01T00:00:00.000Z");

  const rated = (rating: "up" | "down") =>
    feedback()
      .where("companyId", "==", companyId)
      .where("rating", "==", rating)
      .where("createdAt", ">=", monthStart)
      .orderBy("createdAt", "desc");

  const [pending, approved, up, down] = await Promise.all([
    findAll(learnings().where("companyId", "==", companyId).where("status", "==", "pending").orderBy("createdAt", "desc").limit(50)),
    countOf(learnings().where("companyId", "==", companyId).where("status", "==", "approved")),
    countOf(rated("up")),
    countOf(rated("down")),
  ]);

  return json({
    suggestions: pending.map((l) => ({ id: l._id, text: l.text, createdAt: l.createdAt })),
    approved,
    feedback: { up, down },
    lastRun: session.company.lastLearningAt ?? null,
  });
}
