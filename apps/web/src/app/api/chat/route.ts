import Anthropic from "@anthropic-ai/sdk";
import { ObjectId } from "mongodb";
import { conversations, knowledge, projects, type ChatMessage } from "@/lib/db";
import { AGENT_TRAINING } from "@/constants/agentTraining";
import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { planOf } from "@/lib/plans";
import { addTokens, tokensUsed } from "@/lib/usage";
import { forbidden, json, readBody, unauthorized } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import { systemPromptFor } from "@/lib/persona";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_MESSAGE_CHARS = 20_000;
const MAX_HISTORY = 40;

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();
  const { user, company } = session;

  if (!can(session.role, "chat")) {
    return forbidden("Your role is read-only. Ask an admin to change your access.");
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return json(
      { error: "The AI is not configured yet. Add ANTHROPIC_API_KEY to apps/web/.env.local and restart." },
      503
    );
  }

  const limited = await rateLimit(`chat:user:${user._id.toString()}`, 30, 600);
  if (!limited.ok) {
    return json(
      { error: "You're sending messages very quickly. Please wait a minute and try again.", code: "rate_limited" },
      429
    );
  }

  const plan = planOf(company.plan);
  const usedBefore = await tokensUsed(company._id);
  if (usedBefore >= plan.monthlyTokens) {
    return json(
      {
        error: `Your company has used all ${plan.monthlyTokens.toLocaleString()} tokens on the ${plan.name} plan this month. Upgrade to keep going.`,
        code: "limit_reached",
      },
      402
    );
  }

  const body = await readBody(request);
  const text = String(body.message ?? "").trim();
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  const requestedProject = typeof body.projectId === "string" ? body.projectId : "";
  const depth: "basic" | "advanced" = body.depth === "advanced" ? "advanced" : "basic";
  const requestedAgent = typeof body.agent === "string" && body.agent in AGENT_TRAINING && (!company.agents || company.agents.includes(body.agent)) ? body.agent : "";

  if (!text) return json({ error: "Message is empty." }, 400);
  if (text.length > MAX_MESSAGE_CHARS) return json({ error: "Message is too long." }, 400);

  const col = await conversations();
  const now = new Date();
  const userMessage: ChatMessage = { role: "user", content: text, createdAt: now };

  let id: ObjectId;
  let history: ChatMessage[];
  let projectId: ObjectId | undefined;
  let agentId = "";

  if (conversationId) {
    if (!ObjectId.isValid(conversationId)) return json({ error: "Not found." }, 404);
    const existing = await col.findOne({ _id: new ObjectId(conversationId), userId: user._id });
    if (!existing) return json({ error: "Not found." }, 404);
    id = existing._id;
    history = existing.messages;
    projectId = existing.projectId;
    agentId = existing.agent ?? "";
    await col.updateOne({ _id: id }, { $push: { messages: userMessage }, $set: { updatedAt: now, depth } });
  } else {
    if (requestedProject) {
      if (!ObjectId.isValid(requestedProject)) return json({ error: "Project not found." }, 404);
      const found = await (await projects()).findOne({
        _id: new ObjectId(requestedProject),
        companyId: company._id,
      });
      if (!found) return json({ error: "Project not found." }, 404);
      projectId = found._id;
    }

    agentId = requestedAgent;
    const created = await col.insertOne({
      userId: user._id,
      ...(projectId ? { projectId } : {}),
      ...(agentId ? { agent: agentId } : {}),
      depth,
      title: text.replace(/\s+/g, " ").slice(0, 60),
      messages: [userMessage],
      createdAt: now,
      updatedAt: now,
    });
    id = created.insertedId;
    history = [];
  }

  const messages = [...history, userMessage]
    .slice(-MAX_HISTORY)
    .map(({ role, content }) => ({ role, content }));

  const project = projectId ? await (await projects()).findOne({ _id: projectId, companyId: company._id }) : null;
  const kb = await (await knowledge()).find({ companyId: company._id }).sort({ updatedAt: -1 }).limit(20).toArray();
  const system = systemPromptFor({
    agentId,
    depth,
    industry: company.industry,
    about: company.about,
    knowledge: kb.map((k) => ({ title: k.title, content: k.content })),
    name: user.name,
    companyName: company.name,
    projectName: project?.name,
    projectInstructions: project?.instructions,
  });

  const client = new Anthropic();
  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, event: object) => {
    try {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    } catch {
      /* the browser disconnected (e.g. the Stop button); nothing to send to */
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      send(controller, { type: "meta", conversationId: id.toString() });

      let reply = "";
      let aborted = false;
      try {
        const response = client.messages.stream({
          model: process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5",
          max_tokens: 16000,
          system,
          messages,
        });

        // Stop button / closed tab: stop paying for a reply nobody is reading.
        request.signal.addEventListener("abort", () => {
          aborted = true;
          response.abort();
        });

        response.on("text", (delta) => {
          reply += delta;
          send(controller, { type: "text", text: delta });
        });

        const final = await response.finalMessage();

        if (final.stop_reason === "refusal") {
          const note = reply ? "\n\nI can't help with that request." : "I can't help with that request.";
          reply += note;
          send(controller, { type: "text", text: note });
        }

        const spent = final.usage.input_tokens + final.usage.output_tokens;
        await addTokens(company._id, spent);
        send(controller, {
          type: "done",
          usage: { used: usedBefore + spent, limit: plan.monthlyTokens },
        });
      } catch (error) {
        if (aborted) {
          // Charge a rough estimate (about 4 characters per token) for what was generated.
          await addTokens(company._id, Math.ceil((system.length + JSON.stringify(messages).length + reply.length) / 4));
          return;
        }
        const message =
          error instanceof Anthropic.AuthenticationError
            ? "The Anthropic API key was rejected. Check ANTHROPIC_API_KEY."
            : error instanceof Anthropic.RateLimitError
              ? "Too many requests right now. Please try again in a moment."
              : error instanceof Anthropic.APIError
                ? `The AI service returned an error (${error.status}).`
                : "Something went wrong while contacting the AI.";
        console.error("chat error:", error);
        send(controller, { type: "error", message });
      } finally {
        if (reply) {
          await col.updateOne(
            { _id: id },
            {
              $push: { messages: { role: "assistant", content: reply, createdAt: new Date() } },
              $set: { updatedAt: new Date() },
            }
          );
        }
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
