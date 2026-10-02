import { feedback, learnings } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { json, unauthorized } from "@/lib/http";

export async function GET() {
  const session = await currentSession();
  if (!session) return unauthorized();

  const companyId = session.company._id;
  const monthStart = new Date(new Date().toISOString().slice(0, 7) + "-01T00:00:00.000Z");

  const [pending, approved, up, down] = await Promise.all([
    (await learnings()).find({ companyId, status: "pending" }).sort({ createdAt: -1 }).limit(50).toArray(),
    (await learnings()).countDocuments({ companyId, status: "approved" }),
    (await feedback()).countDocuments({ companyId, rating: "up", createdAt: { $gte: monthStart } }),
    (await feedback()).countDocuments({ companyId, rating: "down", createdAt: { $gte: monthStart } }),
  ]);

  return json({
    suggestions: pending.map((l) => ({ id: l._id.toString(), text: l.text, createdAt: l.createdAt })),
    approved,
    feedback: { up, down },
    lastRun: session.company.lastLearningAt ?? null,
  });
}
