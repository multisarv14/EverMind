import { conversations, countOf, decisions, findAll, knowledge, projects, reports, tasks } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { json, unauthorized } from "@/lib/http";

export async function GET() {
  const session = await currentSession();
  if (!session) return unauthorized();

  const companyId = session.company._id;
  const [projectCount, taskDocs, decisionCount, reportCount, knowledgeCount, chatCount] = await Promise.all([
    countOf(projects().where("companyId", "==", companyId)),
    findAll(tasks().where("companyId", "==", companyId)),
    countOf(decisions().where("companyId", "==", companyId)),
    countOf(reports().where("companyId", "==", companyId)),
    countOf(knowledge().where("companyId", "==", companyId)),
    countOf(conversations().where("userId", "==", session.user._id)),
  ]);

  const open = taskDocs.filter((t) => t.status !== "done");
  const activeProjects = new Set(open.filter((t) => t.projectId).map((t) => t.projectId));

  return json({
    projects: projectCount,
    activeInitiatives: activeProjects.size,
    openTasks: open.length,
    doingTasks: taskDocs.filter((t) => t.status === "doing").length,
    doneTasks: taskDocs.filter((t) => t.status === "done").length,
    decisions: decisionCount,
    reports: reportCount,
    knowledge: knowledgeCount,
    conversations: chatCount,
  });
}
