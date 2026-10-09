import type { Session } from "@/lib/auth";
import { conversations, decisions, projects, tasks, users } from "@/lib/db";
import { spendStatus } from "@/lib/entitlements";

const fmt = (d: Date) => d.toISOString().slice(0, 10);

/** A company status report built purely from your own data (no AI needed). */
export async function buildReport(session: Session, days: number) {
  const companyId = session.company._id;
  const since = new Date(Date.now() - days * 86_400_000);

  const [projectList, taskList, decisionList, members] = await Promise.all([
    (await projects()).find({ companyId }).sort({ updatedAt: -1 }).toArray(),
    (await tasks()).find({ companyId }).toArray(),
    (await decisions()).find({ companyId }).sort({ updatedAt: -1 }).toArray(),
    (await users()).find({ companyId }, { projection: { _id: 1 } }).toArray(),
  ]);
  const chats = await (await conversations()).countDocuments({
    userId: { $in: members.map((m) => m._id) },
    createdAt: { $gte: since },
  });

  const count = (s: string) => taskList.filter((t) => t.status === s).length;
  const doneInPeriod = taskList.filter((t) => t.status === "done" && t.updatedAt >= since).length;
  const { plan, used } = await spendStatus(session.company);
  const open = taskList.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => t.due && t.due < fmt(new Date()));

  const lines: string[] = [];
  lines.push(`# ${session.company.name} — status report`);
  lines.push(`_Last ${days} days · generated ${fmt(new Date())}_`, "");
  lines.push("## At a glance");
  lines.push(`- **Projects:** ${projectList.length}`);
  lines.push(`- **Tasks:** ${count("todo")} to do · ${count("doing")} in progress · ${count("done")} done (${doneInPeriod} finished in the last ${days} days)`);
  lines.push(`- **Overdue tasks:** ${overdue.length}`);
  lines.push(`- **Decisions:** ${decisionList.filter((d) => d.status === "approved").length} approved · ${decisionList.filter((d) => d.status === "proposed").length} awaiting a decision · ${decisionList.filter((d) => d.status === "rejected").length} rejected`);
  lines.push(`- **Conversations with EverMind:** ${chats} in the last ${days} days`);
  lines.push(`- **Team:** ${members.length} member${members.length === 1 ? "" : "s"}`);
  lines.push(`- **AI usage this month:** ${used.toLocaleString()} of ${plan.monthlyCredits.toLocaleString()} credits (${plan.name} plan)`, "");

  lines.push("## Projects");
  if (projectList.length === 0) lines.push("_No projects yet._");
  for (const p of projectList.slice(0, 15)) {
    const mine = taskList.filter((t) => t.projectId?.equals(p._id));
    const done = mine.filter((t) => t.status === "done").length;
    lines.push(`- **${p.name}** — ${mine.length === 0 ? "no tasks yet" : `${done}/${mine.length} tasks done`}`);
  }
  lines.push("");

  lines.push("## Open tasks");
  if (open.length === 0) lines.push("_Nothing open — all caught up._");
  for (const t of open.slice(0, 20)) {
    lines.push(`- [${t.status === "doing" ? "in progress" : "to do"}] ${t.title}${t.due ? ` _(due ${t.due})_` : ""}`);
  }
  lines.push("");

  lines.push("## Decisions");
  if (decisionList.length === 0) lines.push("_No decisions logged yet._");
  for (const d of decisionList.slice(0, 15)) {
    lines.push(`- **${d.title}** — ${d.status}${d.decision ? `: ${d.decision.replace(/\s+/g, " ").slice(0, 160)}` : ""}`);
  }

  return lines.join("\n");
}
