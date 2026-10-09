import { conversations, dailyUsage, decisions, tasks, users } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { json, unauthorized } from "@/lib/http";

const DAYS = 14;

function lastDays(n: number) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
  return out;
}

export async function GET() {
  const session = await currentSession();
  if (!session) return unauthorized();

  const companyId = session.company._id;
  const days = lastDays(DAYS);
  const since = new Date(`${days[0]}T00:00:00.000Z`);

  const members = await (await users()).find({ companyId }, { projection: { name: 1 } }).toArray();
  const memberIds = members.map((m) => m._id);

  const [usageDocs, chats, taskDocs, decisionDocs] = await Promise.all([
    (await dailyUsage()).find({ companyId, day: { $gte: days[0] } }).toArray(),
    (await conversations())
      .find({ userId: { $in: memberIds }, createdAt: { $gte: since } }, { projection: { userId: 1, createdAt: 1 } })
      .toArray(),
    (await tasks()).find({ companyId }, { projection: { status: 1 } }).toArray(),
    (await decisions()).find({ companyId }, { projection: { status: 1 } }).toArray(),
  ]);

  // Days from before credits existed only have raw tokens.
  const creditsOf = (u: { credits?: number; tokens: number }) => u.credits ?? u.tokens;
  const creditsByDay = new Map(usageDocs.map((u) => [u.day, creditsOf(u)]));
  const chatsByDay = new Map<string, number>();
  const chatsByUser = new Map<string, number>();
  for (const c of chats) {
    const d = c.createdAt.toISOString().slice(0, 10);
    chatsByDay.set(d, (chatsByDay.get(d) ?? 0) + 1);
    chatsByUser.set(c.userId.toString(), (chatsByUser.get(c.userId.toString()) ?? 0) + 1);
  }

  const count = <T extends { status: string }>(list: T[], s: string) => list.filter((x) => x.status === s).length;

  return json({
    days: days.map((d) => ({ day: d, credits: creditsByDay.get(d) ?? 0, conversations: chatsByDay.get(d) ?? 0 })),
    totals: {
      credits: usageDocs.reduce((a, u) => a + creditsOf(u), 0),
      conversations: chats.length,
    },
    tasks: { todo: count(taskDocs, "todo"), doing: count(taskDocs, "doing"), done: count(taskDocs, "done") },
    decisions: {
      proposed: count(decisionDocs, "proposed"),
      approved: count(decisionDocs, "approved"),
      rejected: count(decisionDocs, "rejected"),
    },
    members: members
      .map((m) => ({ name: m.name, conversations: chatsByUser.get(m._id.toString()) ?? 0 }))
      .sort((a, b) => b.conversations - a.conversations),
  });
}
