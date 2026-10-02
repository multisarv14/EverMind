import { test } from "node:test";
import assert from "node:assert/strict";
import { Client, addMember, mailsTo, newCompany, unique } from "./helpers.mjs";

test("security headers are present", async () => {
  const c = new Client();
  const r = await c.call("/login", { raw: true });
  assert.equal(r.headers.get("x-frame-options"), "DENY");
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.ok(r.headers.get("content-security-policy")?.includes("frame-ancestors"));
});

test("health endpoint answers without signing in", async () => {
  const r = await new Client().get("/api/health");
  assert.equal(r.status, 200);
  assert.equal(r.data.ok, true);
});

test("anonymous visitors are refused everywhere private", async () => {
  const c = new Client();
  for (const p of ["/api/auth/me", "/api/projects", "/api/tasks", "/api/decisions", "/api/knowledge", "/api/reports", "/api/analytics", "/api/team", "/api/learning"]) {
    const r = await c.get(p);
    assert.equal(r.status, 401, `${p} should be 401`);
  }
});

test("sign up validates input and creates a signed-in company owner", async () => {
  const c = new Client();
  const id = unique();
  const good = { companyName: `Validate ${id}`, teamSize: "2–10", industry: "retail", name: "Val Idate", email: `val${id}@test.dev`, password: "long-enough-1" };
  assert.equal((await c.post("/api/auth/signup", { ...good, password: "short" })).status, 400);
  assert.equal((await c.post("/api/auth/signup", { ...good, email: "not-an-email" })).status, 400);
  assert.equal((await c.post("/api/auth/signup", { ...good, industry: "made-up" })).status, 400);
  assert.equal((await c.post("/api/auth/signup", { ...good, teamSize: "huge" })).status, 400);
  assert.equal((await c.post("/api/auth/signup", good)).status, 201);
  assert.equal((await c.post("/api/auth/signup", good)).status, 409, "duplicate email");

  const me = await c.get("/api/auth/me");
  assert.equal(me.status, 200);
  assert.equal(me.data.role, "owner");
  assert.equal(me.data.company.industry, "retail");
  assert.equal(me.data.needsOnboarding, true);
  assert.equal(me.data.plan.id, "free");
});

test("login accepts the right password only, and logout ends the session", async () => {
  const owner = await newCompany("Login");
  const c = new Client();
  assert.equal((await c.post("/api/auth/login", { email: owner.email, password: "wrong-password" })).status, 401);
  assert.equal((await c.post("/api/auth/login", { email: owner.email, password: owner.password })).status, 200);
  assert.equal((await c.get("/api/auth/me")).status, 200);
  await c.post("/api/auth/logout");
  assert.equal((await c.get("/api/auth/me")).status, 401);
});

test("repeated wrong passwords are rate limited", async () => {
  const email = `victim${unique()}@test.dev`;
  const c = new Client();
  const codes = [];
  for (let i = 0; i < 11; i++) codes.push((await c.post("/api/auth/login", { email, password: `wrong-${i}` })).status);
  assert.deepEqual(codes.slice(0, 8), Array(8).fill(401));
  assert.ok(codes.slice(8).every((s) => s === 429), `expected 429s after 8 tries, got ${codes}`);
});

test("password reset: single-use link, revokes old sessions, no account enumeration", async () => {
  const owner = await newCompany("Reset");
  const other = new Client();
  await other.post("/api/auth/login", { email: owner.email, password: owner.password }); // a second session
  await new Promise((r) => setTimeout(r, 1100)); // sessions record whole seconds; keep this one strictly older than the reset

  const unknown = await new Client().post("/api/auth/forgot", { email: `ghost${unique()}@test.dev` });
  assert.equal(unknown.status, 200);
  assert.equal((await new Client().post("/api/auth/forgot", { email: owner.email })).status, 200);

  const mail = mailsTo(owner.email).find((m) => /Reset/.test(m.subject));
  assert.ok(mail, "a reset email was created");
  const token = mail.text.match(/token=(\S+)/)[1];

  assert.equal((await new Client().post("/api/auth/reset", { token, password: "short" })).status, 400);
  assert.equal((await new Client().post("/api/auth/reset", { token: "bogus", password: "new-password-456" })).status, 400);
  assert.equal((await new Client().post("/api/auth/reset", { token, password: "new-password-456" })).status, 200);
  assert.equal((await new Client().post("/api/auth/reset", { token, password: "again-password-789" })).status, 400, "link works once");

  assert.equal((await new Client().post("/api/auth/login", { email: owner.email, password: owner.password })).status, 401);
  assert.equal((await new Client().post("/api/auth/login", { email: owner.email, password: "new-password-456" })).status, 200);
  assert.equal((await other.get("/api/auth/me")).status, 401, "older sessions are signed out");
});

test("choosing the AI team and enforcing it in chat", async () => {
  const owner = await newCompany("Team", { onboard: false });
  assert.equal((await owner.patch("/api/company/agents", { agents: [] })).status, 400);
  assert.equal((await owner.patch("/api/company/agents", { agents: ["bogus"] })).status, 400);
  const r = await owner.patch("/api/company/agents", { agents: ["finance", "legal", "nonexistent"] });
  assert.deepEqual(r.data.agents, ["finance", "legal"]);

  const me = await owner.get("/api/auth/me");
  assert.equal(me.data.needsOnboarding, false);
  assert.deepEqual(me.data.agents, ["finance", "legal"]);

  const ok = await owner.chat("What is our runway?", { agent: "finance" });
  assert.match(ok.reply, /\[agent:Finance Agent\]/);
  const off = await owner.chat("Write code", { agent: "engineering" });
  assert.match(off.reply, /\[agent:none\]/, "an agent the company turned off is not used");
});

test("depth is passed to the AI and remembered on the conversation", async () => {
  const owner = await newCompany("Depth");
  const a = await owner.chat("Explain pricing", { agent: "finance", depth: "advanced" });
  assert.match(a.reply, /\[depth:ADVANCED\]/);
  const b = await owner.chat("And again", { agent: "finance" });
  assert.match(b.reply, /\[depth:BASIC\]/);
  const convo = await owner.get(`/api/conversations/${a.conversationId}`);
  assert.equal(convo.data.depth, "advanced");
});

test("team roles: invite, join, permissions and seat limit", async () => {
  const owner = await newCompany("Roles");
  const viewer = await addMember(owner, "viewer");
  const member = await addMember(owner, "member");

  // viewers can read but never change or chat
  assert.equal((await viewer.get("/api/tasks")).status, 200);
  assert.equal((await viewer.post("/api/tasks", { title: "Sneaky task" })).status, 403);
  assert.equal((await viewer.post("/api/projects", { name: "Sneaky" })).status, 403);
  assert.equal((await viewer.post("/api/knowledge", { title: "Sneaky", content: "Sneaky content" })).status, 403);
  assert.equal((await viewer.chat("hello")).status, 403);
  // members can work but cannot manage people or the plan
  assert.equal((await member.post("/api/tasks", { title: "Real task" })).status, 201);
  assert.equal((await member.post("/api/team/invites", { email: `x${unique()}@test.dev`, role: "member" })).status, 403);
  assert.equal((await member.patch("/api/settings/company", { name: "Hijacked" })).status, 403);
  assert.equal((await member.post("/api/plan/upgrade", { plan: "pro" })).status, 403);

  // free plan has 3 seats: owner + viewer + member are used
  const full = await owner.post("/api/team/invites", { email: `fourth${unique()}@test.dev`, role: "member" });
  assert.equal(full.status, 402);
  assert.equal(full.data.code, "seats_full");

  // joining without an invitation is refused
  const stranger = await new Client().post("/api/auth/signup", { joining: true, name: "No Invite", email: `noinv${unique()}@test.dev`, password: "test-password-123" });
  assert.equal(stranger.status, 404);
});

test("companies cannot see or touch each other's data", async () => {
  const a = await newCompany("Alpha");
  const b = await newCompany("Beta");
  const project = (await a.post("/api/projects", { name: "Alpha secret project" })).data.id;
  const task = (await a.post("/api/tasks", { title: "Alpha secret task" })).data.id;
  const decision = (await a.post("/api/decisions", { title: "Alpha secret decision" })).data.id;
  const note = (await a.post("/api/knowledge", { title: "Alpha secret", content: "Alpha knowledge text" })).data.id;

  assert.equal((await b.get(`/api/projects/${project}`)).status, 404);
  assert.equal((await b.patch(`/api/tasks/${task}`, { status: "done" })).status, 404);
  assert.equal((await b.patch(`/api/decisions/${decision}`, { status: "approved" })).status, 404);
  assert.equal((await b.patch(`/api/knowledge/${note}`, { title: "Hijacked title", content: "Hijacked content" })).status, 404);
  for (const p of ["/api/projects", "/api/decisions", "/api/knowledge", "/api/tasks"]) {
    const list = JSON.stringify((await b.get(p)).data);
    assert.ok(!list.includes("Alpha"), `${p} leaked another company's data`);
  }
});

test("projects, tasks, decisions and knowledge work end to end", async () => {
  const c = await newCompany("Work");
  const p = (await c.post("/api/projects", { name: "Launch", description: "Q4", instructions: "Be brief." })).data.id;
  assert.equal((await c.post("/api/tasks", { title: "x" })).status, 400, "title too short");
  const t = (await c.post("/api/tasks", { title: "Write the plan", projectId: p })).data.id;
  assert.equal((await c.patch(`/api/tasks/${t}`, { status: "done" })).status, 200);
  assert.equal((await c.patch(`/api/tasks/${t}`, { status: "weird" })).status, 400);
  assert.equal((await c.get(`/api/tasks?project=${p}`)).data.tasks.length, 1);

  const list = (await c.get("/api/projects")).data.projects.find((x) => x.id === p);
  assert.deepEqual([list.openTasks, list.doneTasks], [0, 1]);

  const d = (await c.post("/api/decisions", { title: "Hire first?", context: "Pre-revenue" })).data.id;
  assert.equal((await c.patch(`/api/decisions/${d}`, { status: "approved", decision: "Engineer first" })).status, 200);
  const rec = await c.post(`/api/decisions/${d}/recommend`);
  assert.equal(rec.status, 200);
  assert.ok(rec.data.recommendation);

  const k = await c.post("/api/knowledge", { title: "What we sell", content: "AI CRM for clinics" });
  assert.equal(k.status, 201);

  const ov = (await c.get("/api/overview")).data;
  assert.equal(ov.projects, 1);
  assert.equal(ov.decisions, 1);
  assert.equal(ov.knowledge, 1);
});

test("AI breaks a goal into tasks and recommends agents (invalid ids dropped)", async () => {
  const c = await newCompany("Ai");
  const gen = await c.post("/api/tasks/generate", { goal: "Launch our beta to 50 clinics" });
  assert.equal(gen.status, 201);
  assert.equal(gen.data.created, 2);
  const rec = await c.post("/api/company/recommend-agents");
  assert.deepEqual(rec.data.picks.map((p) => p.id), ["finance", "legal"]);
});

test("chat streams, saves the conversation, counts tokens and takes feedback", async () => {
  const c = await newCompany("Chat");
  const before = (await c.get("/api/auth/me")).data.usage.used;
  const r = await c.chat("Plan our launch");
  assert.match(r.reply, /Reply to: Plan our launch/);

  const convo = await c.get(`/api/conversations/${r.conversationId}`);
  assert.equal(convo.data.messages.length, 2);
  assert.equal((await c.get("/api/auth/me")).data.usage.used - before, 25);

  const follow = await c.chat("And the budget?", { conversationId: r.conversationId });
  assert.equal(follow.conversationId, r.conversationId);
  assert.equal((await c.get(`/api/conversations/${r.conversationId}`)).data.messages.length, 4);

  assert.equal((await c.post("/api/feedback", { conversationId: r.conversationId, messageIndex: 1, rating: "down" })).status, 200);
  assert.equal((await c.post("/api/feedback", { conversationId: r.conversationId, messageIndex: 0, rating: "up" })).status, 404, "only assistant messages can be rated");
  assert.deepEqual((await c.get(`/api/feedback?conversation=${r.conversationId}`)).data.ratings, { 1: "down" });
  assert.equal((await c.post("/api/feedback", { conversationId: r.conversationId, messageIndex: 1, rating: null })).status, 200);

  const empty = await c.chat("   ");
  assert.equal(empty.status, 400);
});

test("learning suggests facts, the owner approves, and agents then know them", async () => {
  const c = await newCompany("Learn");
  await c.chat("We sell AI CRM software to small clinics in Pune");
  const run = await c.post("/api/learning/run");
  assert.equal(run.status, 200);
  assert.equal(run.data.created, 2);

  const pending = (await c.get("/api/learning")).data.suggestions;
  assert.equal(pending.length, 2);
  assert.equal((await c.patch(`/api/learning/${pending[0].id}`, { action: "approve", text: "The company sells AI CRM to clinics and pharmacies in Pune." })).status, 200);
  assert.equal((await c.patch(`/api/learning/${pending[1].id}`, { action: "dismiss" })).status, 200);

  const kb = (await c.get("/api/knowledge")).data.items;
  assert.ok(kb.some((i) => i.content.includes("pharmacies in Pune")), "approved fact joined company knowledge");
  assert.equal((await c.get("/api/learning")).data.suggestions.length, 0);
});

test("reports and analytics return real data", async () => {
  const c = await newCompany("Reports");
  await c.post("/api/projects", { name: "Alpha" });
  await c.post("/api/tasks", { title: "Do the thing" });
  await c.chat("hello there");
  const rep = await c.post("/api/reports", { days: 7, withAi: false });
  assert.equal(rep.status, 201);
  const body = (await c.get(`/api/reports/${rep.data.id}`)).data.body;
  assert.match(body, /At a glance/);
  assert.match(body, /Do the thing/);
  const an = (await c.get("/api/analytics")).data;
  assert.equal(an.days.length, 14);
  assert.equal(an.tasks.todo, 1);
  assert.ok(an.totals.tokens > 0);
});

test("plan: usage is capped on the free plan and upgrades are only requests", async () => {
  const c = await newCompany("Plan");
  const me = (await c.get("/api/auth/me")).data;
  assert.equal(me.plan.id, "free");
  assert.equal((await c.post("/api/plan/upgrade", { plan: "bogus" })).status, 400);
  assert.equal((await c.post("/api/plan/upgrade", { plan: "pro", note: "please" })).status, 201);
  assert.equal((await c.get("/api/auth/me")).data.upgradeRequested, true);
});
