import { ObjectId } from "mongodb";
import { conversations } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { json, unauthorized } from "@/lib/http";

// Strip markdown so previews read as plain text.
const plain = (md: string) =>
  md.replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>~|-]+/g, " ").replace(/\s+/g, " ").trim();

export async function GET(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const project = new URL(request.url).searchParams.get("project");
  const filter: Record<string, unknown> = { userId: session.user._id };
  if (project && ObjectId.isValid(project)) filter.projectId = new ObjectId(project);

  const list = await (await conversations())
    .find(filter, { projection: { title: 1, updatedAt: 1, projectId: 1, agent: 1, messages: { $slice: -1 } } })
    .sort({ updatedAt: -1 })
    .limit(100)
    .toArray();

  return json({
    conversations: list.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      updatedAt: c.updatedAt,
      projectId: c.projectId?.toString() ?? null,
      agent: c.agent ?? null,
      preview: plain(c.messages[0]?.content ?? "").slice(0, 160),
    })),
  });
}
