import { conversations, findAll } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { docId, json, unauthorized } from "@/lib/http";

// Strip markdown so previews read as plain text.
const plain = (md: string) =>
  md.replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>~|-]+/g, " ").replace(/\s+/g, " ").trim();

export async function GET(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const project = docId(new URL(request.url).searchParams.get("project"));
  let query = conversations().where("userId", "==", session.user._id);
  if (project) query = query.where("projectId", "==", project);

  const list = await findAll(query.orderBy("updatedAt", "desc").limit(100));

  return json({
    conversations: list.map((c) => ({
      id: c._id,
      title: c.title,
      updatedAt: c.updatedAt,
      projectId: c.projectId ?? null,
      agent: c.agent ?? null,
      preview: plain(c.lastMessage ?? "").slice(0, 160),
    })),
  });
}
