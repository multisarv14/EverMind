import {
  appendMessage,
  conversations,
  findAll,
  findById,
  firestore,
  knowledge,
  messageId,
  messagesOf,
  projects,
  readMessages,
  type ChatMessage,
  type Id,
} from "@/lib/db";
import { AGENT_TRAINING } from "@/constants/agentTraining";
import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { recordSpend, spendStatus, limitMessage } from "@/lib/entitlements";
import { docId, forbidden, json, readBody, unauthorized } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import { systemPromptFor } from "@/lib/persona";
import { AI_NOT_CONFIGURED, aiConfig, describeLlmError, streamChat } from "@/lib/llm";

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

  const ai = await aiConfig();
  if (!ai) return json({ error: AI_NOT_CONFIGURED, code: "ai_not_configured" }, 503);

  const limited = await rateLimit(`chat:user:${user._id}`, 30, 600);
  if (!limited.ok) {
    return json(
      { error: "You're sending messages very quickly. Please wait a minute and try again.", code: "rate_limited" },
      429
    );
  }

  const spend = await spendStatus(company);
  if (spend.blocked) return json({ error: limitMessage(spend.plan), code: "limit_reached" }, 402);

  const body = await readBody(request);
  const text = String(body.message ?? "").trim();
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  const requestedProject = typeof body.projectId === "string" ? body.projectId : "";
  const depth: "basic" | "advanced" = body.depth === "advanced" ? "advanced" : "basic";
  const requestedAgent = typeof body.agent === "string" && body.agent in AGENT_TRAINING && (!company.agents || company.agents.includes(body.agent)) ? body.agent : "";

  if (!text) return json({ error: "Message is empty." }, 400);
  if (text.length > MAX_MESSAGE_CHARS) return json({ error: "Message is too long." }, 400);

  const col = conversations();
  const now = new Date();
  const userMessage: ChatMessage = { role: "user", content: text, createdAt: now };

  let id: Id;
  let history: ChatMessage[];
  let projectId: Id | undefined;
  let agentId = "";

  if (conversationId) {
    const existing = await findById(col, docId(conversationId), { userId: user._id });
    if (!existing) return json({ error: "Not found." }, 404);
    id = existing._id;
    history = await readMessages(existing, MAX_HISTORY);
    projectId = existing.projectId;
    agentId = existing.agent ?? "";
    await appendMessage(id, userMessage, { depth });
  } else {
    if (requestedProject) {
      const found = await findById(projects(), docId(requestedProject), { companyId: company._id });
      if (!found) return json({ error: "Project not found." }, 404);
      projectId = found._id;
    }

    agentId = requestedAgent;
    const ref = col.doc();
    const batch = firestore().batch();
    batch.create(ref, {
      _id: ref.id,
      userId: user._id,
      companyId: company._id,
      ...(projectId ? { projectId } : {}),
      ...(agentId ? { agent: agentId } : {}),
      depth,
      title: text.replace(/\s+/g, " ").slice(0, 60),
      messageCount: 1,
      lastMessage: text.slice(0, 2000),
      createdAt: now,
      updatedAt: now,
    });
    batch.create(messagesOf(ref.id).doc(messageId(0)), { _id: messageId(0), ...userMessage });
    await batch.commit();
    id = ref.id;
    history = [];
  }

  const messages = [...history, userMessage]
    .slice(-MAX_HISTORY)
    .map(({ role, content }) => ({ role, content }));

  const project = await findById(projects(), projectId, { companyId: company._id });
  const kb = await findAll(knowledge().where("companyId", "==", company._id).orderBy("updatedAt", "desc").limit(20));
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
      send(controller, { type: "meta", conversationId: id });

      let reply = "";
      let aborted = false;
      const model = ai.model;
      // Stop button / closed tab: the signal stops the call, so we stop paying for a reply nobody is reading.
      request.signal.addEventListener("abort", () => {
        aborted = true;
      });
      try {
        const final = await streamChat(ai, {
          model,
          maxTokens: 16000,
          system,
          messages,
          signal: request.signal,
          onText: (delta) => {
            reply += delta;
            send(controller, { type: "text", text: delta });
          },
        });

        if (final.refused) {
          const note = reply ? "\n\nI can't help with that request." : "I can't help with that request.";
          reply += note;
          send(controller, { type: "text", text: note });
        }

        const spent = await recordSpend(company, { model, usage: final.usage, feature: "chat", userId: user._id });
        send(controller, {
          type: "done",
          usage: { used: spent.used ?? spend.used, limit: spend.allowance, packBalance: spend.packBalance },
        });
      } catch (error) {
        if (aborted) {
          // Charge a rough estimate (about 4 characters per token) for what was read and generated.
          await recordSpend(company, {
            model,
            usage: {
              input_tokens: Math.ceil((system.length + JSON.stringify(messages).length) / 4),
              output_tokens: Math.ceil(reply.length / 4),
            },
            feature: "chat",
            userId: user._id,
            estimated: true,
          });
          return;
        }
        const { message } = describeLlmError(error);
        console.error("chat error:", error);
        send(controller, { type: "error", message });
      } finally {
        if (reply) {
          await appendMessage(id, { role: "assistant", content: reply, createdAt: new Date() });
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
