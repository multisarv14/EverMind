import { findById, firestore, tasks, projects } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { ask, aiErrorResponse } from "@/lib/ai";
import { canEdit, clip, forbidden, json, docId, readBody, unauthorized } from "@/lib/http";

const SCHEMA = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" } },
        required: ["title"],
        additionalProperties: false,
      },
    },
  },
  required: ["tasks"],
  additionalProperties: false,
};

// Turns a goal into concrete tasks using EverMind (Claude).
export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const body = await readBody(request);
  const goal = clip(body.goal, 1000);
  if (goal.length < 5) return json({ error: "Describe the goal you want broken down." }, 400);

  const projectId = docId(body.projectId);
  if (projectId && !(await findById(projects(), projectId, { companyId: session.company._id }))) {
    return json({ error: "Project not found." }, 404);
  }

  try {
    const text = await ask(session, {
      feature: "tasks",
      system:
        "You are EverMind, an AI Executive. Break the CEO's goal into 4 to 8 concrete, actionable tasks, ordered by sequence. Each title is a short imperative sentence (under 90 characters). Reply only with JSON matching the schema.",
      prompt: `Company: ${session.company.name}\nGoal: ${goal}`,
      maxTokens: 1500,
      schema: SCHEMA,
    });

    const parsed = JSON.parse(text) as { tasks?: { title?: string }[] };
    const titles = (parsed.tasks ?? [])
      .map((t) => clip(t.title, 200))
      .filter((t) => t.length >= 2)
      .slice(0, 8);
    if (titles.length === 0) return json({ error: "EverMind couldn't produce tasks. Try rephrasing the goal." }, 422);

    const now = new Date();
    const batch = firestore().batch();
    for (const title of titles) {
      const ref = tasks().doc();
      batch.create(ref, {
        _id: ref.id,
        companyId: session.company._id,
        title,
        status: "todo",
        ...(projectId ? { projectId } : {}),
        createdBy: session.user._id,
        createdAt: now,
        updatedAt: now,
      });
    }
    await batch.commit();

    return json({ created: titles.length }, 201);
  } catch (error) {
    return aiErrorResponse(error) ?? json({ error: "EverMind returned something unexpected. Please try again." }, 502);
  }
}
