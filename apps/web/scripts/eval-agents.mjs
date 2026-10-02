#!/usr/bin/env node
/**
 * Quality check for the 12 trained agents.
 *
 * Signs up a throwaway company on a running EverMind server, asks every agent
 * real questions in Basic and Advanced depth, and checks the answers. Answers
 * are saved to scripts/eval-out/ so you can read them.
 *
 * It spends real AI tokens. Start the app with a larger allowance first, e.g.
 *   FREE_MONTHLY_TOKENS=1000000 npm run dev
 *
 * Usage:
 *   node scripts/eval-agents.mjs                 all agents, both depths
 *   node scripts/eval-agents.mjs --quick         one question per agent, both depths
 *   node scripts/eval-agents.mjs --agent finance only one agent
 *   BASE_URL=https://your-site node scripts/eval-agents.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const args = process.argv.slice(2);
const quick = args.includes("--quick");
const only = args.includes("--agent") ? args[args.indexOf("--agent") + 1] : null;

// Two realistic CEO questions per agent, plus words a good answer should touch.
const BANK = {
  strategy: { q: ["We are a 6-person SaaS startup with 12 paying clinics. What should our top priorities be next quarter?", "Should we focus on one city or expand to three cities this year?"], any: /(priorit|focus|segment|okr|metric|trade-?off)/i },
  finance: { q: ["We have 18 lakh in the bank and spend 4.5 lakh a month. How long is our runway and how can we extend it?", "How should I price a clinic management software that costs us 300 rupees per clinic per month to serve?"], any: /(runway|burn|margin|cash|price|pricing|assum)/i },
  research: { q: ["How do I find out who our real competitors are in clinic software in India?", "How big is the market for clinic software for small clinics? How would I estimate it?"], any: /(competitor|customer|estimate|assum|verify|interview|tam|sam)/i },
  hr: { q: ["Write a job description for our first sales manager.", "How should I run performance reviews for a team of 15?"], any: /(responsib|skill|requirement|review|feedback|goal|rating)/i },
  product: { q: ["Write a short product requirements doc for appointment reminders via WhatsApp.", "We have 40 feature requests. How do I decide what to build first?"], any: /(user|problem|metric|priorit|rice|requirement|acceptance)/i },
  legal: { q: ["What should I check before signing a services contract with a large hospital customer?", "What compliance filings does a private limited company in India generally need every year?"], any: /(clause|liabil|terminat|confirm|lawyer|advocate|professional|filing|roc)/i },
  engineering: { q: ["Propose a simple architecture for a multi-tenant SaaS with a web app and a mobile app.", "Our API is slow when a clinic has 50,000 patient records. How do I find and fix the cause?"], any: /(database|index|api|cache|query|architecture|tenant|test)/i },
  marketing: { q: ["Plan a 30-day launch for our new appointment reminder feature.", "Write three headline options for our landing page for small clinics."], any: /(audience|channel|week|headline|cta|whatsapp|metric)/i },
  qa: { q: ["Write test cases for a patient appointment booking form.", "What should be on our release-readiness checklist?"], any: /(test|case|expected|edge|regression|boundary|verify)/i },
  sales: { q: ["Write a short cold email to a clinic owner about our software.", "A clinic owner says 'your product is too expensive'. How do I respond?"], any: /(value|roi|clinic|price|objection|next step|call)/i },
  devops: { q: ["Design a CI/CD pipeline for a team of four developers.", "What monitoring and alerts should we set up before launch?"], any: /(pipeline|deploy|rollback|alert|monitor|backup|test|staging)/i },
  support: { q: ["Write a reply to a customer who says our reminders were not delivered and they lost patients.", "Create a simple ticket triage process for a 3-person support team."], any: /(apolog|sorry|understand|priority|sla|escalat|next step|triage)/i },
};

const words = (t) => t.trim().split(/\s+/).filter(Boolean).length;

async function signup() {
  const t = Date.now();
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyName: "Eval Co", teamSize: "Just me", name: "Eval Runner", email: `eval${t}@example.com`, password: "eval-password-123" }),
  });
  if (!res.ok) throw new Error(`Signup failed (${res.status}): ${await res.text()}`);
  const cookie = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  if (!cookie) throw new Error("No session cookie returned.");
  return cookie;
}

async function ask(cookie, agent, depth, message) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ message, agent, depth }),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.json().catch(() => ({}))).error ?? ""}`.trim());

  let text = "";
  let buffer = "";
  const decoder = new TextDecoder();
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let i;
    while ((i = buffer.indexOf("\n\n")) !== -1) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 2);
      if (!line.startsWith("data:")) continue;
      const ev = JSON.parse(line.slice(5));
      if (ev.type === "text") text += ev.text;
      if (ev.type === "error") throw new Error(ev.message);
    }
  }
  return text.trim();
}

function check(depth, agentId, text) {
  const problems = [];
  const n = words(text);
  if (n === 0) problems.push("empty answer");
  if (/as an ai (language )?model/i.test(text)) problems.push("generic AI disclaimer");
  if (/https?:\/\//i.test(text)) problems.push("contains a link (verify it is not invented)");
  if (!BANK[agentId].any.test(text)) problems.push("does not touch the expected topic words");
  if (depth === "basic" && n > 400) problems.push(`too long for Basic (${n} words)`);
  if (depth === "advanced") {
    if (n < 150) problems.push(`too thin for Advanced (${n} words)`);
    if (!/\d/.test(text)) problems.push("no numbers");
    if (!/(assum|trade-?off|risk|metric)/i.test(text)) problems.push("no assumptions/trade-offs/risks/metrics");
  }
  return problems;
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), "eval-out");
mkdirSync(outDir, { recursive: true });

const cookie = await signup();
const agents = Object.keys(BANK).filter((a) => !only || a === only);
if (agents.length === 0) throw new Error(`Unknown agent "${only}". Choose from: ${Object.keys(BANK).join(", ")}`);

let total = 0;
let failed = 0;
console.log(`Evaluating ${agents.length} agent(s) against ${BASE}${quick ? " (quick)" : ""}\n`);

for (const agent of agents) {
  const questions = quick ? BANK[agent].q.slice(0, 1) : BANK[agent].q;
  for (const depth of ["basic", "advanced"]) {
    for (const [i, q] of questions.entries()) {
      total++;
      let answer = "";
      let problems = [];
      try {
        answer = await ask(cookie, agent, depth, q);
        problems = check(depth, agent, answer);
      } catch (e) {
        problems = [`request failed: ${e.message}`];
      }
      if (problems.length) failed++;
      const label = `${agent.padEnd(12)} ${depth.padEnd(8)} Q${i + 1}`;
      console.log(`${problems.length ? "FAIL" : " ok "}  ${label}  ${words(answer)} words${problems.length ? "  -> " + problems.join("; ") : ""}`);
      writeFileSync(join(outDir, `${agent}-${depth}-q${i + 1}.md`), `# ${agent} (${depth})\n\n**Question:** ${q}\n\n${answer}\n`);
    }
  }
}

const me = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookie } }).then((r) => r.json()).catch(() => null);
console.log(`\n${total - failed}/${total} passed. Answers saved in scripts/eval-out/.`);
if (me?.usage) console.log(`Tokens used by this run: ${me.usage.used.toLocaleString()} (plan limit ${me.usage.limit.toLocaleString()})`);
process.exit(failed ? 1 : 0);
