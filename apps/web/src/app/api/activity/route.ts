import { conversations, decisions, findAll, knowledge, projects, reports, tasks } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { json, unauthorized } from "@/lib/http";

interface Item {
  kind: string;
  title: string;
  text: string;
  at: Date;
  href: string;
}

export async function GET() {
  const session = await currentSession();
  if (!session) return unauthorized();

  const companyId = session.company._id;
  const take = 5;

  const [chats, taskDocs, decisionDocs, reportDocs, knowledgeDocs, projectDocs] = await Promise.all([
    findAll(conversations().where("userId", "==", session.user._id).orderBy("updatedAt", "desc").limit(take)),
    findAll(tasks().where("companyId", "==", companyId).orderBy("updatedAt", "desc").limit(take)),
    findAll(decisions().where("companyId", "==", companyId).orderBy("updatedAt", "desc").limit(take)),
    findAll(reports().where("companyId", "==", companyId).orderBy("createdAt", "desc").limit(take)),
    findAll(knowledge().where("companyId", "==", companyId).orderBy("updatedAt", "desc").limit(take)),
    findAll(projects().where("companyId", "==", companyId).orderBy("createdAt", "desc").limit(take)),
  ]);

  const items: Item[] = [
    ...chats.map((c) => ({ kind: "chat", title: c.title, text: "Conversation with EverMind", at: c.updatedAt, href: `/chat/${c._id}` })),
    ...taskDocs.map((t) => ({
      kind: "task",
      title: t.title,
      text: t.status === "done" ? "Task completed" : t.status === "doing" ? "Task in progress" : "Task added",
      at: t.updatedAt,
      href: "/operations",
    })),
    ...decisionDocs.map((d) => ({ kind: "decision", title: d.title, text: `Decision ${d.status}`, at: d.updatedAt, href: "/decisions" })),
    ...reportDocs.map((r) => ({ kind: "report", title: r.title, text: "Report generated", at: r.createdAt, href: `/reports/${r._id}` })),
    ...knowledgeDocs.map((k) => ({ kind: "knowledge", title: k.title, text: "Added to company knowledge", at: k.updatedAt, href: "/knowledge" })),
    ...projectDocs.map((p) => ({ kind: "project", title: p.name, text: "Project created", at: p.createdAt, href: `/projects/${p._id}` })),
  ];

  items.sort((a, b) => b.at.getTime() - a.at.getTime());
  return json({ items: items.slice(0, 6) });
}
