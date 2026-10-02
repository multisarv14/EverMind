import { conversations, decisions, knowledge, projects, reports, tasks } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { json, unauthorized } from "@/lib/http";

export async function GET() {
  const session = await currentSession();
  if (!session) return unauthorized();

  const companyId = session.company._id;
  const [projectCount, taskDocs, decisionCount, reportCount, knowledgeCount, chatCount] = await Promise.all([
    (await projects()).countDocuments({ companyId }),
    (await tasks()).find({ companyId }, { projection: { status: 1, projectId: 1 } }).toArray(),
    (await decisions()).countDocuments({ companyId }),
    (await reports()).countDocuments({ companyId }),
    (await knowledge()).countDocuments({ companyId }),
    (await conversations()).countDocuments({ userId: session.user._id }),
  ]);

  const open = taskDocs.filter((t) => t.status !== "done");
  const activeProjects = new Set(open.filter((t) => t.projectId).map((t) => t.projectId!.toString()));

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
