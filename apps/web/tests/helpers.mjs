import { readdirSync, readFileSync } from "node:fs";

export const BASE = process.env.BASE_URL ?? "http://localhost:3200";
export const OUTBOX = process.env.MAIL_OUTBOX_DIR;
export const unique = () => `${Date.now()}${Math.floor(Math.random() * 1e4)}`;

/** An API client that keeps its own cookies, like one browser. */
export class Client {
  cookie = "";

  async call(path, { method = "GET", body, raw } = {}) {
    const res = await fetch(BASE + path, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(this.cookie ? { Cookie: this.cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });
    const set = res.headers.getSetCookie?.() ?? [];
    for (const c of set) {
      const [pair] = c.split(";");
      if (/^evermind_session=;/.test(c) || /Max-Age=0/i.test(c)) this.cookie = "";
      else this.cookie = pair;
    }
    if (raw) return res;
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, headers: res.headers };
  }

  get = (p) => this.call(p);
  post = (p, body) => this.call(p, { method: "POST", body: body ?? {} });
  patch = (p, body) => this.call(p, { method: "PATCH", body });
  del = (p) => this.call(p, { method: "DELETE" });

  /** Streams a chat message and returns the text plus the conversation id. */
  async chat(message, extra = {}) {
    const res = await fetch(BASE + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: this.cookie },
      body: JSON.stringify({ message, ...extra }),
    });
    if (!res.ok) return { status: res.status, data: await res.json().catch(() => ({})) };
    const text = await res.text();
    let reply = "";
    let conversationId = "";
    for (const block of text.split("\n\n")) {
      if (!block.startsWith("data:")) continue;
      const ev = JSON.parse(block.slice(5));
      if (ev.type === "meta") conversationId = ev.conversationId;
      if (ev.type === "text") reply += ev.text;
      if (ev.type === "error") return { status: 200, error: ev.message, reply, conversationId };
    }
    return { status: 200, reply, conversationId };
  }
}

/** Creates a company and returns a signed-in client for its owner. */
export async function newCompany(label = "Co", { industry = "software", teamSize = "2–10", onboard = true } = {}) {
  const id = unique();
  const c = new Client();
  c.email = `${label.toLowerCase()}${id}@test.dev`;
  c.password = "test-password-123";
  const r = await c.post("/api/auth/signup", { companyName: `${label} ${id}`, teamSize, industry, name: `${label} Owner`, email: c.email, password: c.password });
  if (r.status !== 201) throw new Error(`signup failed: ${r.status} ${JSON.stringify(r.data)}`);
  if (onboard) await c.patch("/api/company/agents", { agents: ["strategy", "finance", "legal"] });
  return c;
}

/** Invites someone into the owner's company and returns a signed-in client for them. */
export async function addMember(owner, role = "member") {
  const id = unique();
  const email = `${role}${id}@test.dev`;
  const inv = await owner.post("/api/team/invites", { email, role });
  if (inv.status !== 201) throw new Error(`invite failed: ${inv.status} ${JSON.stringify(inv.data)}`);
  const c = new Client();
  c.email = email;
  c.password = "test-password-123";
  const r = await c.post("/api/auth/signup", { joining: true, name: `${role} person`, email, password: c.password });
  if (r.status !== 201) throw new Error(`join failed: ${r.status} ${JSON.stringify(r.data)}`);
  return c;
}

export function mailsTo(email) {
  if (!OUTBOX) return [];
  return readdirSync(OUTBOX).sort().map((f) => JSON.parse(readFileSync(`${OUTBOX}/${f}`, "utf8"))).filter((m) => m.to === email);
}
