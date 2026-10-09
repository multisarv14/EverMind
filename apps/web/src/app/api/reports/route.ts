import { reports } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { ask, aiErrorResponse } from "@/lib/ai";
import { buildReport } from "@/lib/report";
import { canEdit, clip, forbidden, json, readBody, unauthorized } from "@/lib/http";

export async function GET() {
  const session = await currentSession();
  if (!session) return unauthorized();

  const list = await (await reports())
    .find({ companyId: session.company._id }, { projection: { title: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return json({ reports: list.map((r) => ({ id: r._id.toString(), title: r.title, createdAt: r.createdAt })) });
}

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const body = await readBody(request);
  const days = body.days === 30 ? 30 : 7;
  const withAi = body.withAi === true;

  let markdown = await buildReport(session, days);

  if (withAi) {
    try {
      const summary = await ask(session, {
        feature: "reports",
        system:
          "You are EverMind, an AI Executive writing for the CEO. Read the company status report and write a concise executive summary in Markdown: 3-5 bullets on what matters most, then **Risks** and **Recommended next steps**. Under 180 words. Use only facts in the report; do not invent numbers.",
        prompt: markdown,
        maxTokens: 900,
      });
      markdown = markdown.replace("\n## At a glance", `\n## Executive summary\n${summary}\n\n## At a glance`);
    } catch (error) {
      return aiErrorResponse(error) ?? json({ error: "Something went wrong." }, 500);
    }
  }

  const title = clip(body.title, 120) || `${session.company.name} — ${days}-day report (${new Date().toISOString().slice(0, 10)})`;
  const created = await (await reports()).insertOne({
    companyId: session.company._id,
    title,
    body: markdown,
    createdBy: session.user._id,
    createdAt: new Date(),
  });

  return json({ id: created.insertedId.toString() }, 201);
}
