# EverMind: Developer Onboarding (Knowledge Transfer)

Read this first if you are new to the project. It explains **what EverMind is, why it exists, how it works,
which technologies it uses, and the rules for changing it** without breaking anything.

> Short version: the product is the Next.js app in **`apps/web`**. Everything else (C# folders) is an old
> prototype. Work only in `apps/web` unless you are told otherwise.

---

## Contents

1. [Objective and goals](#1-objective-and-goals)
2. [Core concepts (the vocabulary)](#2-core-concepts-the-vocabulary)
3. [Tech stack](#3-tech-stack)
4. [Repository layout](#4-repository-layout)
5. [Architecture](#5-architecture)
6. [Main flows, step by step](#6-main-flows-step-by-step)
7. [Data model (MongoDB collections)](#7-data-model-mongodb-collections)
8. [API reference](#8-api-reference)
9. [Screens (pages)](#9-screens-pages)
10. [Local setup](#10-local-setup)
11. [Configuration (environment variables)](#11-configuration-environment-variables)
12. [Testing](#12-testing)
13. [Deployment](#13-deployment)
14. [Coding rules and conventions](#14-coding-rules-and-conventions)
15. [How to add common things](#15-how-to-add-common-things)
16. [Troubleshooting](#16-troubleshooting)
17. [Known gaps and roadmap](#17-known-gaps-and-roadmap)
18. [Glossary](#18-glossary)

---

## 1. Objective and goals

**EverMind is an "AI Executive" for companies.** It acts like a chief of staff plus a team of 12 specialist
advisors (Strategy, Finance, HR, Legal, Engineering, and others) that a company's leadership can talk to. It also
keeps a record of the company's projects, tasks, decisions and knowledge, so that its advice fits *that*
company.

**Who it is for:** founders, CEOs and senior teams of small and mid-size businesses. The default context is
**India** (INR, lakh/crore, Indian business norms). The AI adapts when a company is elsewhere.

**Product goals:**

| Goal | How the product delivers it |
|---|---|
| Give every company a capable "executive team" | 12 trained specialist agents in a chat ([`agentTraining.ts`](../apps/web/src/constants/agentTraining.ts)) |
| Advice that fits the company, not generic answers | Company profile + project instructions + knowledge base are injected into every AI prompt ([`persona.ts`](../apps/web/src/lib/persona.ts)) |
| Turn talk into work | Projects, tasks (with AI "break this goal into tasks"), decision log with AI recommendations, one-click reports |
| Get smarter over time, safely | Nightly learning job suggests facts; **a human approves** before they become knowledge |
| Work for teams | Company workspaces, roles (owner/admin/member/viewer), invitations, seat limits |
| Sustainable cost | Paid plans and credit packs priced above the Claude API cost; every AI call metered by its real cost ([`lib/pricing.ts`](../apps/web/src/lib/pricing.ts)) |
| Safe by default | Company data isolation, rate limits, signed sessions, no account enumeration, security headers |

**Non-goals right now:** EverMind does not take actions outside the app (no sending emails on your
behalf, no payments, no deployments). There is no payment system yet; "Upgrade" only records a request.

---

## 2. Core concepts (the vocabulary)

Learn these words. They appear everywhere in the code and UI.

| Concept | Meaning | Where in code |
|---|---|---|
| **Company** (workspace) | The tenant. Every piece of data belongs to one company. Has a plan, industry, "about" text and enabled agents. | `companies` collection, `CompanyDoc` in [`db.ts`](../apps/web/src/lib/db.ts) |
| **User** | A person. Belongs to exactly one company and has one **role**. | `users`, `UserDoc` |
| **Role** | `owner` > `admin` > `member` > `viewer`. Decides what a user may do. | [`constants/team.ts`](../apps/web/src/constants/team.ts) |
| **Invite** | A pending seat. An admin invites an email; that person signs up with "join" and gets the role. | `invites`, `/api/team/invites` |
| **Plan** | `free`, `pro`, `business`: a price (INR + GST), a monthly **credit** allowance and a **seat** limit. | [`lib/plans.ts`](../apps/web/src/lib/plans.ts) |
| **Credit** | EverMind's unit of AI usage, based on what the call cost us: 1 credit = $0.0000064 (one Opus token at a typical input/output mix). Cheaper models use fewer credits for the same work. | [`lib/pricing.ts`](../apps/web/src/lib/pricing.ts) |
| **Usage window** | The month credits are counted in: the calendar month on Free, or monthly from the subscription start on paid plans (yearly plans too). | `usageWindow()` in [`lib/usage.ts`](../apps/web/src/lib/usage.ts) |
| **Credit pack / grant** | Extra credits bought on a paid plan (or given by an admin), valid 12 months, used **after** the monthly allowance. | `creditGrants`, [`lib/entitlements.ts`](../apps/web/src/lib/entitlements.ts) |
| **Subscription** | A Razorpay subscription that keeps `companies.plan` and `companies.billing` up to date through signed webhooks. | [`lib/billing.ts`](../apps/web/src/lib/billing.ts) |
| **Agent** | One of 12 specialists (strategy, finance, research, hr, product, legal, engineering, marketing, qa, sales, devops, support). It is **not** a separate service. It is a block of training text added to the system prompt. | [`constants/agentTraining.ts`](../apps/web/src/constants/agentTraining.ts), [`constants/agents.ts`](../apps/web/src/constants/agents.ts) (icons/labels) |
| **Enabled agents** | Which agents a company has switched on (chosen in onboarding). If `company.agents` is missing, **all** are enabled. | `enabledAgents()` in [`lib/me.ts`](../apps/web/src/lib/me.ts) |
| **Industry** | Company type picked at sign-up. It recommends a starting set of agents. | [`constants/industries.ts`](../apps/web/src/constants/industries.ts) |
| **Depth** | `basic` (plain, short) or `advanced` (frameworks, numbers, tables). Chosen per conversation. | `DEPTH_PROMPT` in `persona.ts` |
| **Conversation** | A chat thread owned by one user. It may be tied to an agent and/or a project. | `conversations` |
| **Project** | A workspace for one goal (launch, fundraise...). Has **instructions** that are added to the AI prompt for chats in that project. | `projects` |
| **Task** | `todo` → `doing` → `done`, optional assignee, due date and project. | `tasks` |
| **Decision** | A logged decision: context, options, final call, status (`proposed`/`approved`/`rejected`), optional AI recommendation. | `decisions` |
| **Knowledge** | Facts the team wrote about the company. The latest 20 are added to AI prompts (about 6,000 characters budget). Treated as *facts, never instructions*. | `knowledge` |
| **Learning** | A nightly job reads recent chats and thumbs-down feedback and proposes up to 5 new facts. Status `pending` → owner/member **approves** (it becomes Knowledge) or **dismisses** it. | [`lib/learning.ts`](../apps/web/src/lib/learning.ts), `learnings` |
| **Feedback** | 👍/👎 on an AI message. It feeds learning and analytics. | `feedback` |
| **Report** | A Markdown status report built **from the company's own data, without AI**. | [`lib/report.ts`](../apps/web/src/lib/report.ts) |
| **Session** | A signed JWT in the `evermind_session` cookie (7 days). | [`lib/auth.ts`](../apps/web/src/lib/auth.ts) |

**Permission matrix** (from `constants/team.ts`):

| Action | owner | admin | member | viewer |
|---|:-:|:-:|:-:|:-:|
| Chat with EverMind (`chat`) | ✅ | ✅ | ✅ | ❌ |
| Create/edit projects, tasks, decisions, knowledge (`createProject`) | ✅ | ✅ | ✅ | ❌ |
| Invite and manage the team (`manageTeam`) | ✅ | ✅ | ❌ | ❌ |
| Manage plan and billing (`manageBilling`) | ✅ | ❌ | ❌ | ❌ |

Extra rule: only the **owner** can invite admins. Viewers can read everything in their company but change nothing.

---

## 3. Tech stack

| Layer | Technology | Version | Why / notes |
|---|---|---|---|
| Framework | **Next.js** (App Router) | 16.2 | Pages and the JSON API live in one app. ⚠️ Next 16 has breaking changes: request gating lives in **`src/proxy.ts`** (formerly "middleware"), and route `params` are a **Promise** (`await ctx.params`). Check `node_modules/next/dist/docs/` before using an API you remember from older versions. |
| UI library | **React** | 19.2 | Server components for layouts; most pages are client components (`"use client"`). |
| Language | **TypeScript** | 5 | Strict typing; path alias `@/` → `src/`. |
| Styling | **Tailwind CSS** | v4 (via `@tailwindcss/postcss`) | Utility classes; theme colors as CSS variables in `globals.css`; light/dark via `ThemeToggle` + `lib/theme.ts`. |
| Animation | **framer-motion** | 12 | Marketing page and reveals. |
| Icons | **lucide-react** | | All icons. |
| Markdown | **react-markdown** + **remark-gfm** | | Renders AI answers and reports (tables, lists). |
| Database | **MongoDB** (official `mongodb` driver, no ORM) | Server 7, driver 7 | One shared client; indexes created on first connect; TTL indexes clean up rate limits and reset tokens automatically. |
| AI | **Anthropic Claude** via **`@anthropic-ai/sdk`** | | Default model `claude-opus-5-5` (`ANTHROPIC_MODEL`). Streaming for chat; JSON-schema structured output for tasks, agent recommendations and learning. |
| Auth | **jose** (JWT HS256) + **bcryptjs** (cost 12) | | Stateless signed cookie; passwords hashed; a password change invalidates older sessions. |
| Email | **nodemailer** (SMTP) | | Invites and password reset. Without `SMTP_URL` the email is printed to the server console. |
| Runtime | **Node.js** | 20+ local, 22 in Docker | |
| Container | **Docker** / **docker compose** | | Multi-stage, non-root, `output: "standalone"` build. |
| Tests | **`node:test`** + a mock Claude server | | End-to-end API tests against a throw-away DB. |
| Lint | **ESLint 9** + `eslint-config-next` | | `npm run lint` |

**Legacy (not used):** `apps/api`, `services/*`, `agents/*`, `packages/*`, `tests/EverMind.Tests`,
`EverMind.slnx` are an earlier **.NET/C#** prototype. They are not built, deployed or called by the web app.
Do not add features there.

---

## 4. Repository layout

```
EverMind/
├── apps/
│   ├── web/                    ← THE PRODUCT (Next.js)
│   └── api/                    ← legacy C# API (unused)
├── services/ agents/ packages/ tests/ EverMind.slnx   ← legacy C# (unused)
├── brand/                      ← logos (svg/png)
├── docs/
│   ├── ONBOARDING.md           ← this file
│   └── DEPLOY_TICKET.md        ← production deployment checklist
├── scripts/                    ← legacy C# build scripts
└── docker-compose.yml          ← app + MongoDB for deployment
```

Inside **`apps/web`**:

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (marketing)/        public: landing page, /terms, /privacy
│   │   ├── (auth)/             /login, /signup, /forgot, /reset
│   │   ├── (onboarding)/       /onboarding: owner picks the AI team after sign-up
│   │   ├── (app)/              signed-in app (layout checks the session)
│   │   │   ├── dashboard/      Command Center
│   │   │   ├── chat/ chat/[id] Conversations
│   │   │   ├── projects/ [id]  Projects
│   │   │   ├── intelligence/   AI status, overview, learning
│   │   │   ├── agents/         Your AI team
│   │   │   ├── knowledge/      Knowledge base + learning suggestions
│   │   │   ├── decisions/      Decision log
│   │   │   ├── operations/     Tasks board
│   │   │   ├── people/         Team, invites, roles
│   │   │   ├── analytics/      Usage and activity charts
│   │   │   ├── reports/ [id]   Status reports
│   │   │   └── settings/       Profile, company, theme, plan
│   │   ├── api/                JSON API (route.ts files), see section 8
│   │   ├── layout.tsx, error.tsx, global-error.tsx, not-found.tsx, robots.ts, sitemap.ts
│   ├── components/             UI building blocks (ChatView, Sidebar, AppShell, forms, charts...)
│   ├── constants/              static product data: agents, agentTraining, industries, team roles, projectTemplates
│   ├── lib/                    server and client logic (see below)
│   ├── proxy.ts                request gate (Next 16 "proxy", formerly middleware)
│   └── instrumentation.ts      runs at server start → starts the nightly learning scheduler
├── scripts/
│   ├── ensure-db.sh            starts/creates the local "evermind-mongo" Docker container
│   ├── test-api.sh             runs the test suite (throw-away DB + mock Claude)
│   └── eval-agents.mjs         checks agent answer quality with the REAL API (costs tokens)
├── tests/                      api.test.mjs, helpers.mjs, mock-claude.mjs
├── Dockerfile, docker.env.example, next.config.ts
```

**`src/lib/`: what each file does**

| File | Responsibility |
|---|---|
| `db.ts` | Mongo client (single, reused across hot reloads), all document types, collection getters, index creation |
| `auth.ts` | `startSession`, `endSession`, `currentSession()` (verifies JWT, loads user + company + role) |
| `me.ts` | `buildMe()`: everything the UI needs about the current user (role, permissions, plan, usage, agents) |
| `http.ts` | API helpers: `json`, `unauthorized`, `forbidden`, `readBody`, `canEdit`, `oid`, `clip` |
| `ai.ts` | `ask()` / `askCompany()`: one non-streaming Claude call with rate limit, plan limit and usage accounting; `AiError` + `aiErrorResponse` |
| `persona.ts` | `systemPromptFor()`: builds the system prompt (base persona + company + agent training + depth + project + knowledge) |
| `learning.ts` | `runLearning(company)`: extracts suggested facts from recent chats |
| `learningScheduler.ts` | Hourly timer; in the configured UTC hour it runs learning for due companies (safe across multiple instances) |
| `plans.ts` | Plans (prices, credits, seats), credit packs, grace period |
| `pricing.ts` | Anthropic price per model, `costMicros()`, credits, GST |
| `usage.ts` | Usage window, `creditsUsed`, pack balance, `drawFromPacks` |
| `entitlements.ts` | `effectivePlan`, `spendStatus` / `spendBlock` (may the company use AI?), `recordSpend` (charge a call, then 80%/100% emails) |
| `billing.ts` | Razorpay client (subscriptions, payment links, cancel), webhook signature check and event handling |
| `ratelimit.ts` | Mongo-backed fixed-window rate limiter, `clientIp`, `tooManyRequests` |
| `mail.ts` / `emails.ts` | Sending (SMTP / console / test outbox) and email templates |
| `report.ts` | Builds the Markdown status report from company data |
| `client.ts` / `useApi.ts` | Browser-side: `api()` fetch wrapper with `ApiError`, `useApi()` hook, shared client types (`Me`) |
| `theme.ts` | Light/dark theme helpers |

---

## 5. Architecture

```
 Browser (React client components)
   │  fetch JSON / SSE stream             cookie: evermind_session (JWT)
   ▼
 Next.js server (Node runtime)
   ├─ proxy.ts ............ quick gate: no cookie → /login (pages) or 401 (API)
   ├─ (app)/layout.tsx .... real check: currentSession() → redirect /login or /onboarding
   ├─ app/api/**/route.ts . currentSession() → role check (can/canEdit) → company-scoped DB query
   │      │                         │
   │      │                         └─ lib/ai.ts / chat route ──► Anthropic Claude API
   │      │                                (rate limit → plan limit → call → addTokens)
   │      └─ lib/db.ts ─────────────────► MongoDB  (database "evermind")
   ├─ lib/mail.ts ──────────────────────► SMTP server (optional)
   └─ instrumentation.ts → learningScheduler (hourly timer, inside the same process)
```

Key design decisions (keep them unless the team agrees to change them):

1. **One deployable.** UI and API are the same Next.js server. No separate backend.
2. **Multi-tenant by `companyId`.** Every company-owned document stores `companyId`. **Every query must filter by
   `session.company._id`.** Conversations are owned by `userId` (private to that user).
3. **Two-layer auth.** `proxy.ts` only checks that a cookie *exists* (fast, optimistic). The *real* check is
   `currentSession()` in every API route and in the `(app)` layout. Never rely on the proxy alone.
4. **The agents are prompts, not services.** Adding or improving an agent means editing `agentTraining.ts`, not new
   infrastructure.
5. **Every AI call goes through accounting.** Chat does it inline; everything else uses `ask()` in `lib/ai.ts`. Never
   call `new Anthropic()` directly anywhere else.
6. **Humans approve what the AI learns.** Learning only creates `pending` suggestions.
7. **The app works without AI.** If `ANTHROPIC_API_KEY` is missing, AI endpoints return `503` with a clear message;
   everything else works.
8. **Rate limits and TTL in MongoDB**, so it works across multiple server instances without Redis.

---

## 6. Main flows, step by step

### 6.1 Sign up (new company)
1. `/signup` → `POST /api/auth/signup` with name, email, password, companyName, teamSize, industry, about.
2. Rate limit per IP (`SIGNUP_LIMIT_PER_HOUR`, default 15/hour). Validation (password ≥ 8 chars, valid email...).
3. Creates a **company** (`plan: "free"`, no `agents` yet) and a **user** with `role: "owner"`, password hashed with bcrypt.
4. `startSession()` sets the cookie.
5. The `(app)` layout sees *owner + industry set + no agents* → redirects to **`/onboarding`**.
6. Onboarding: industry-recommended agents are shown (optionally refined by AI via
   `POST /api/company/recommend-agents`). The owner saves → `PATCH /api/company/agents` sets `company.agents`.
7. The user lands on the **Command Center** (`/dashboard`).

### 6.2 Invite and join a team
1. Admin/owner on **People** → `POST /api/team/invites {email, role}`.
2. Checks: `manageTeam` permission; only the owner may invite admins; **seats** (members + pending invites < plan seats,
   else `402 seats_full`); email not already a user.
3. Invite is stored; an email with `/signup?join=1&email=...` is sent (or printed in the console without SMTP).
4. The invitee signs up with `joining: true` → the user is created in **that** company with the invited role; the invite is deleted.

### 6.3 Login, session and logout
- `POST /api/auth/login`: email + password, rate-limited, bcrypt compare, `startSession()`.
- The cookie holds a JWT (`sub` = userId, `iat`), HS256 signed with `AUTH_SECRET`, valid 7 days, `httpOnly`, `sameSite=lax`, `secure` in production.
- `currentSession()` rejects tokens issued **before `user.passwordChangedAt`**, so a password reset logs out all devices.
- `POST /api/auth/logout` deletes the cookie. `GET /api/auth/me` returns `buildMe()`.

### 6.4 Forgot / reset password
1. `/forgot` → `POST /api/auth/forgot {email}`. **Always** returns `{"ok":true}` (no account enumeration).
2. Limits: 10/hour per IP, 3/hour per email (the 4th request silently does nothing).
3. If the user exists: a random 32-byte token is created; only its **sha256 hash** is stored in `passwordResets`
   (TTL 1 hour, older tokens for that user deleted); the link `${APP_URL}/reset?token=...` is emailed.
4. `/reset` → `POST /api/auth/reset {token, password}` → hash matches → new password, `passwordChangedAt = now`,
   token deleted (single use).

> 💡 Locally without `SMTP_URL`, **the reset link is printed in the terminal running `npm run dev`**.
> If nothing is printed, the email probably has no account (check `db.users` in the `evermind` DB).

### 6.5 Chat (the heart of the product)
`POST /api/chat` with `{message, conversationId?, projectId?, agent?, depth}` (see [`api/chat/route.ts`](../apps/web/src/app/api/chat/route.ts)):

1. `currentSession()`; role must allow `chat` (viewers get `403`).
2. No API key → `503`. Per-user rate limit (30 messages / 10 min) → `429`.
3. Credit check (`spendStatus`): allowance used up **and** no pack credits → `402 limit_reached`.
4. Validate: non-empty, ≤ 20,000 chars; agent must exist **and** be enabled for the company.
5. Load or create the conversation (owned by this user); append the user message.
6. Build the **system prompt** with `systemPromptFor()`:
   `BASE persona` + `company name/person` + `industry/about` + `agent training block` + `depth` +
   `project name + instructions` + `latest 20 knowledge items (≈6,000 chars budget)`.
7. Send the last 40 messages to Claude with **streaming**.
8. The response is **Server-Sent Events**: `meta` (conversationId) → many `text` deltas → `done` (usage) or `error`.
9. When the stream ends: `recordSpend()` charges the real cost in credits, then the assistant reply is saved. If the user pressed **Stop**, the Claude stream
   is aborted and an *estimated* token cost is charged.
10. The user can rate a reply → `POST /api/feedback` (👍/👎 per message index).

### 6.6 Other AI features (all through `ask()` in `lib/ai.ts`)
| Feature | Endpoint | Output |
|---|---|---|
| Break a goal into tasks | `POST /api/tasks/generate` | JSON schema → tasks inserted |
| Recommend agents for the company | `POST /api/company/recommend-agents` | JSON schema with `enum` of agent ids (invalid ids dropped) |
| Recommend on a decision | `POST /api/decisions/[id]/recommend` | Text saved to `decision.aiRecommendation` |
| Learning run (manual) | `POST /api/learning/run` | Pending suggestions |

`ask()` applies: API key check → company burst limit (60 calls / 10 min) → plan limit → Claude call → `addTokens`
→ refusal handling → friendly `AiError` with HTTP status. Use `aiErrorResponse(error)` in routes.

### 6.7 Nightly learning
1. `instrumentation.ts` starts `startLearningScheduler()` when the Node server boots (only if an API key is set and
   `LEARNING_SCHEDULER` ≠ `off`).
2. Every hour it checks if the current UTC hour = `LEARNING_HOUR_UTC` (default 21 = 02:30 IST).
3. For up to 50 companies not run in the last 20 hours, it **claims** the company atomically (safe with several
   instances), then `runLearning()`:
   reads up to 15 recent conversations + 👎 feedback + existing knowledge → Claude (optionally a cheaper
   `ANTHROPIC_LEARNING_MODEL`) returns ≤ 5 facts → de-duplicated → saved as `pending`.
4. A member+ approves (optionally editing) → it is copied to **Knowledge** as "Learned: ..." and is used in future prompts.

⚠️ It runs **inside the server process**. On serverless hosts or a sleeping machine it does not run.

### 6.8 Plans, credits and billing

**Business model.** EverMind pays Anthropic per API token and sells its *own* plans with a margin. We never resell Claude
Pro/Max subscriptions, never give customers an API key, and never call our plans "Claude" plans.

| Plan | Price (ex GST) | Credits / month | Seats | Packs |
|---|---|---|---|---|
| Free | ₹0 | 50k (`FREE_MONTHLY_CREDITS`) | 3 (`FREE_SEATS`) | ❌ |
| Pro | ₹2,999 / month · ₹29,990 / year | 2M | 25 | ✅ |
| Business | ₹14,999 / month · ₹1,49,990 / year | 10M | 100 | ✅ |

Packs (paid plans, valid 12 months): 500k ₹799 · 1M ₹1,499 · 5M ₹6,999, all + 18% GST. At about ₹563 of Opus cost per
1M credits this is a ~60% gross margin when a customer uses everything. Change prices only in `lib/plans.ts`, and model
costs only in `lib/pricing.ts`.

**How a call is charged** (`recordSpend` in `lib/entitlements.ts`):
1. Before the call, `spendStatus` blocks AI (`402 limit_reached`) only when the allowance is used up and no pack credits are left.
2. After the call, the real cost is computed from `usage` (input, output, cache write/read tokens × model rate) and turned into credits.
3. The credits are added to the window's `usage` doc; the part above the allowance is taken from packs (soonest-expiring first).
4. One `usageEvents` row is stored (model, feature, tokens, cost) and the owner is emailed once at 80% and once at 100%.

**Payments (Razorpay).** Only on when `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are set;
otherwise Settings shows the old "request an upgrade" form (`POST /api/plan/upgrade`).
- **Subscribe / switch:** `POST /api/billing/checkout {plan, interval}` → Razorpay subscription → the owner pays on Razorpay's page.
- **Credit pack:** `POST /api/billing/topup {pack}` → Razorpay payment link (price + GST) → back to `/settings?tab=plan&paid=1`.
- **Cancel:** `POST /api/billing/cancel` → stops renewal; the plan lasts to the end of the paid period.
- **Webhook:** `POST /api/billing/webhook` (public, HMAC-signed). **Only the webhook changes a plan or adds credits.** Each
  event id is stored in `billingEvents` and each payment id is unique, so retries never double-apply.

| Razorpay event | Effect |
|---|---|
| `subscription.activated` / `charged` / `resumed` | `plan` set, `billing.status = active`, period dates updated, payment + receipt email. A newer subscription cancels the previous one immediately (plan switch). |
| `subscription.pending` / `halted` | `billing.status = past_due`, 7-day grace (`GRACE_DAYS`), payment-failed email. After the grace, `effectivePlan` treats the company as Free. |
| `subscription.cancelled` / `completed` | Back to `free` (ignored for an old, already-replaced subscription). Pack credits stay. |
| `payment_link.paid` | Credit pack granted (`creditGrants`), payment recorded, receipt email. |

**One-time Razorpay setup** (per environment):
1. Create the account and complete KYC; Razorpay needs live Terms, Privacy and Refund pages.
2. In the dashboard, create four **subscription plans** with amounts = price × 1.18 (GST): Pro monthly ₹3,538.82,
   Pro yearly ₹35,388.20, Business monthly ₹17,698.82, Business yearly ₹1,76,988.20. Put their ids in `RAZORPAY_PLAN_*`.
3. Add a **webhook** to `https://<domain>/api/billing/webhook` with a secret (`RAZORPAY_WEBHOOK_SECRET`) and the events
   above. Use test-mode keys first.

**Known limits:** a plan switch starts the new subscription at full price without pro-rating the old one (refund by hand
if needed); GST invoices with a GSTIN are not generated yet (Razorpay sends payment receipts); there is no automatic
top-up.

**Admin chores** (`apps/web/scripts/billing-admin.mjs`, uses `MONGODB_URI`):
`report [YYYY-MM]` (revenue vs AI cost per company; compare with the Anthropic Console bill) ·
`grant <owner-email> <credits> [note]` · `set-plan <owner-email> <plan>` (no payment).

### 6.9 Reports and analytics
- `POST /api/reports` builds a Markdown report from projects, tasks, decisions, chat counts, team size and token use
  (no AI, no cost) and stores it. `GET /api/reports/[id]` reads it.
- `GET /api/analytics` returns usage per day, feedback counts, activity. `GET /api/overview` / `/api/activity` feed the dashboard.

---

## 7. Data model (MongoDB collections)

Database: **`evermind`** (from `MONGODB_URI`). Tests use `evermind_test`. Types live in [`lib/db.ts`](../apps/web/src/lib/db.ts).

| Collection | Key fields | Scope | Indexes / notes |
|---|---|---|---|
| `users` | name, **email** (lowercase, unique), passwordHash, companyId, role, passwordChangedAt | company | unique `email`; `companyId` |
| `companies` | name, teamSize, industry, about, plan, agents[], lastLearningAt, billing {status, interval, subscriptionId, periodStart/End, cancelAtPeriodEnd, graceUntil} | tenant root | `billing.subscriptionId` |
| `invites` | companyId, email, role, invitedBy | company | `email`; unique `{companyId, email}` |
| `conversations` | **userId**, title, messages[{role, content, createdAt}], agent, depth, projectId | **user** (private) | `{userId, updatedAt}` |
| `projects` | companyId, name, description, instructions, createdBy | company | `{companyId, updatedAt}` |
| `tasks` | companyId, projectId?, title, status, assigneeId?, due (YYYY-MM-DD) | company | `{companyId, updatedAt}` |
| `decisions` | companyId, title, context, options, decision, status, aiRecommendation? | company | `{companyId, updatedAt}` |
| `knowledge` | companyId, title, content | company | `{companyId, updatedAt}` |
| `reports` | companyId, title, body (Markdown) | company | `{companyId, createdAt}` |
| `feedback` | companyId, userId, conversationId, messageIndex, agent, rating | company | unique `{userId, conversationId, messageIndex}` |
| `learnings` | companyId, text, status (pending/approved/dismissed) | company | `{companyId, status, createdAt}` |
| `usage` | `_id = companyId:window`, credits, costMicros, tokens, warned80/100 | company | window = `YYYY-MM` or the billing-month start date |
| `dailyUsage` | `_id = companyId:YYYY-MM-DD`, credits, costMicros, tokens | company | |
| `usageEvents` | companyId, userId, feature, model, input/output/cache tokens, costMicros, credits | company | `{companyId, createdAt}` |
| `creditGrants` | companyId, source (pack/admin), credits, remaining, paymentId, expiresAt | company | unique `paymentId` |
| `payments` | companyId, kind, plan/packId, amount (paise, incl. GST), status, gatewayPaymentId | company | unique `gatewayPaymentId` |
| `billingEvents` | `_id = Razorpay event id`, type | global | makes webhooks idempotent |
| `upgradeRequests` | companyId, userId, plan, note | company | used only when online payment is off |
| `passwordResets` | `_id = sha256(token)`, userId, expiresAt | user | **TTL** on `expiresAt` |
| `rateLimits` | `_id = key:bucket`, count, expireAt | global | **TTL** on `expireAt` |

Useful mongosh commands:

```js
use evermind
db.users.find({}, { email: 1, role: 1, companyId: 1 })
db.companies.updateOne({ name: "Acme" }, { $set: { plan: "pro" } })   // manual upgrade
db.rateLimits.deleteMany({})                                         // clear all rate limits (dev only!)
```

---

## 8. API reference

All endpoints are under `src/app/api/**/route.ts`, return JSON (`{ error: "..." }` on failure) and need a session
unless marked public.

| Area | Endpoints | Who |
|---|---|---|
| Auth | `POST auth/signup`, `POST auth/login`, `POST auth/logout`, `GET auth/me`, `POST auth/forgot`, `POST auth/reset` | public (except `me`) |
| Health | `GET health` → `{"ok":true}` if DB reachable | public |
| Status | `GET status` → AI configured? model | any |
| Chat | `POST chat` (SSE stream) | member+ |
| Conversations | `GET conversations`, `GET/DELETE conversations/[id]` | owner of the conversation |
| Feedback | `GET/POST feedback` | member+ |
| Company | `PATCH company/agents`, `POST company/recommend-agents` | owner for changes |
| Projects | `GET/POST projects`, `GET/PATCH/DELETE projects/[id]` | read: all · write: member+ |
| Tasks | `GET/POST tasks`, `PATCH/DELETE tasks/[id]`, `POST tasks/generate` (AI) | read: all · write: member+ |
| Decisions | `GET/POST decisions`, `PATCH/DELETE decisions/[id]`, `POST decisions/[id]/recommend` (AI) | read: all · write: member+ |
| Knowledge | `GET/POST knowledge`, `PATCH/DELETE knowledge/[id]` | read: all · write: member+ |
| Learning | `GET learning`, `PATCH learning/[id]` (approve/dismiss), `POST learning/run` | member+ |
| Reports | `GET/POST reports`, `GET/DELETE reports/[id]` | read: all · write: member+ |
| Dashboard data | `GET overview`, `GET activity`, `GET analytics` | all |
| Team | `GET team`, `POST team/invites`, `DELETE team/invites/[id]`, `PATCH/DELETE team/members/[id]` | admin+ for changes |
| Settings | `PATCH settings/profile`, `PATCH settings/company` | self / owner |
| Billing | `GET billing` (payments), `POST billing/checkout`, `POST billing/topup`, `POST billing/cancel` | owner (others get an empty list) |
| Billing webhook | `POST billing/webhook` | public, Razorpay-signed |
| Plan request | `POST plan/upgrade` (only without online payment) | owner |

Check the exact method list in each `route.ts`; the table above is a map, not a contract.

**Status codes used consistently:** `400` bad input · `401` not signed in · `403` role not allowed · `404` not
found **or belongs to another company** (never reveal existence) · `402` plan limit / seats full · `409`
duplicate · `429` rate limited (`Retry-After` header) · `503` AI not configured · `502` AI provider error.

---

## 9. Screens (pages)

| Sidebar item | Route | What it does |
|---|---|---|
| Command Center | `/dashboard` | Overview of activity, tasks, decisions, quick start |
| Conversations | `/chat`, `/chat/[id]` | Chat with EverMind or a specific agent; depth toggle; stop; 👍/👎 |
| Projects | `/projects`, `/projects/[id]` | Goal workspaces with instructions, tasks and project chats; templates in `projectTemplates.ts` |
| Intelligence | `/intelligence` | AI status/model, overview, learning summary |
| Agents | `/agents` | The 12 specialists, details drawer, start a chat |
| Knowledge | `/knowledge` | Company facts + learning suggestions to approve |
| Decisions | `/decisions` | Decision log + "Get EverMind's recommendation" |
| Operations | `/operations` | Task board (todo/doing/done), assignees, due dates, AI task breakdown |
| People | `/people` | Members, roles, invites, permission table |
| Analytics | `/analytics` | Token usage per day, feedback, activity |
| Reports | `/reports`, `/reports/[id]` | One-click status reports |
| Settings | `/settings` | Profile, company, appearance, plan and upgrade request |

Public: `/` (landing), `/login`, `/signup`, `/forgot`, `/reset`, `/terms`, `/privacy`. Owner-only first run: `/onboarding`.

---

## 10. Local setup

Requirements: **Node 20+**, **Docker**, an Anthropic API key (optional; the app works without AI).

```bash
# 1. MongoDB in Docker (or: cd apps/web && npm run db)
docker run -d --name evermind-mongo --restart unless-stopped -p 27017:27017 -v evermind-mongo:/data/db mongo:7

# 2. Install
cd apps/web
npm ci

# 3. Configure: create apps/web/.env.local (git-ignored)
cat > .env.local <<'ENV'
MONGODB_URI=mongodb://localhost:27017/evermind
AUTH_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
ANTHROPIC_API_KEY=<your key, optional>
ANTHROPIC_MODEL=claude-opus-5-5
# Optional, for real emails:
# SMTP_URL=smtp://user:pass@smtp.example.com:587
# MAIL_FROM=EverMind <no-reply@yourdomain.com>
# APP_URL=http://localhost:3000
ENV

# 4. Run
npm run dev:all        # ensures Mongo is up, then http://localhost:3000
```

First steps after it starts: open `/signup`, create a company, pick agents, and try a chat.

Commands:

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (hot reload) |
| `npm run dev:all` | Start Mongo container if needed, then dev server |
| `npm run db` | Only (re)start the Mongo container |
| `npm run build` / `npm start` | Production build / run |
| `npm run lint` | ESLint |
| `npm test` | API test suite (section 12) |
| `node scripts/eval-agents.mjs --quick` | Agent quality check with the real API (**costs tokens**) |

---

## 11. Configuration (environment variables)

| Variable | Default | Required | Purpose |
|---|---|:-:|---|
| `MONGODB_URI` | `mongodb://localhost:27017/evermind` | ✅ (prod) | Database |
| `AUTH_SECRET` | none | ✅ | JWT signing key, **≥ 32 chars**. Changing it logs everyone out. |
| `ANTHROPIC_API_KEY` | none | | Enables AI |
| `ANTHROPIC_MODEL` | `claude-opus-5-5` | | Model for chat and AI actions (`claude-sonnet-5-5` is about half the cost) |
| `ANTHROPIC_LEARNING_MODEL` | same as above | | Model for the nightly job |
| `ANTHROPIC_BASE_URL` | Anthropic | | Used by tests to point at the mock Claude |
| `FREE_MONTHLY_CREDITS` | `50000` | | Free plan monthly credits (`FREE_MONTHLY_TOKENS` still works) |
| `FREE_SEATS` | `3` | | Free plan seats |
| `APP_URL` | request origin | ✅ (prod) | Public URL for email links, sitemap, robots |
| `SMTP_URL` | none | ✅ (prod) | Real email. Without it, emails print to the console. |
| `MAIL_FROM` | `EverMind <no-reply@localhost>` | | From address |
| `MAIL_OUTBOX_DIR` | none | | Tests: write emails as JSON files instead of sending |
| `SIGNUP_LIMIT_PER_HOUR` | `15` | | Sign-ups per IP per hour |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | none | for payments | Razorpay API keys (test or live) |
| `RAZORPAY_WEBHOOK_SECRET` | none | for payments | Secret of the Razorpay webhook |
| `RAZORPAY_PLAN_{PRO,BUSINESS}_{MONTHLY,YEARLY}` | none | for payments | Razorpay plan ids |
| `RAZORPAY_API_URL` | Razorpay | | Tests point it at the fake Razorpay |
| `LEARNING_SCHEDULER` | on | | `off` disables the nightly job |
| `LEARNING_HOUR_UTC` | `21` | | Hour the nightly job runs |

Files: local → `apps/web/.env.local`; Docker → `apps/web/docker.env` (template: `docker.env.example`).
**Never commit either file.**

---

## 12. Testing

```bash
cd apps/web
npm test
```

What happens ([`scripts/test-api.sh`](../apps/web/scripts/test-api.sh)): it ensures Mongo is running, drops the
`evermind_test` database, starts a **mock Claude and Razorpay** on port 9999 and the app on port 3200 with test env vars, runs
`tests/*.test.mjs` with `node --test`, then cleans up. **No real API key and no cost.**

Covered (20 tests): security headers, health, anonymous access refused, sign-up validation, login/logout,
login rate limit, password reset (single use, revokes sessions, no enumeration), agent selection enforced in chat,
depth, team roles/invites/seat limit, **company isolation**, projects/tasks/decisions/knowledge CRUD, AI task
generation and agent recommendations, chat streaming + tokens + feedback, learning approve flow, reports/analytics,
upgrade requests, and in `tests/billing.test.mjs`: subscribe → renew → pack → failed payment → grace → cancel,
plan switching, signed and repeated webhooks, and the allowance → packs → blocked order.

⚠️ **macOS note:** the script uses `setsid` and `docker exec evermind-mongo`, which are standard on Linux.
macOS has no `setsid` by default (`brew install util-linux` provides it), and your Mongo must be the
`evermind-mongo` container. Linux or CI is the reliable place to run the suite.

**Rule:** every new API behavior, especially permissions and company isolation, gets a test in `tests/api.test.mjs`.
If you add an AI feature, teach `tests/mock-claude.mjs` to answer it.

---

## 13. Deployment

Full checklist: [`docs/DEPLOY_TICKET.md`](DEPLOY_TICKET.md). Summary:

```bash
cp apps/web/docker.env.example apps/web/docker.env   # fill AUTH_SECRET, APP_URL, SMTP_URL, MAIL_FROM, ANTHROPIC_API_KEY
docker compose up -d --build                         # app on :3000 + MongoDB 7 with "mongo-data" volume
curl localhost:3000/api/health                       # {"ok":true}
```

- Put **HTTPS** in front (Caddy/Nginx). Production sends HSTS and secure cookies.
- Never expose MongoDB port 27017 publicly. Or use MongoDB Atlas (`mongodb+srv://.../evermind`) and remove the `mongo` service.
- Daily `mongodump` backups kept off the server; test a restore.
- Keep the server **always on** (the nightly learning job lives in the process).
- Monitor `/api/health`; read logs with `docker compose logs -f web`.
- Terms and Privacy pages still contain placeholders (`[company name]`, `[support email]`...). They must be filled before launch.

---

## 14. Coding rules and conventions

These are the rules that keep EverMind correct and safe. Reviewers will check them.

**Security and data**
1. **Every API route starts with** `const session = await currentSession(); if (!session) return unauthorized();`
2. **Check the role** with `can(session.role, ...)` or `canEdit(session)` before any write. Return `forbidden()`.
3. **Every query on company data includes `companyId: session.company._id`**, including `findOne` by `_id`.
   Conversations filter by `userId: session.user._id`. A wrong company returns `404`, never `403`.
4. Convert ids with `oid()`; never `new ObjectId(untrusted)` without validation.
5. Read bodies with `readBody()`; trim and limit strings with `clip(value, max)`. Lowercase emails.
6. Never return `passwordHash`, tokens or other companies' data. Never log secrets.
7. Do not reveal whether an email exists (forgot password, login errors).
8. Rate limit any public or expensive endpoint with `rateLimit(key, limit, windowSeconds)`.

**AI**
9. Use `ask()` / `askCompany()` for every non-chat Claude call, so limits and usage are always applied. Return
   `aiErrorResponse(error)` from the catch.
10. Use a **JSON schema** (`schema` option) when you need structured output, and still validate the result (for example,
    drop unknown agent ids).
11. Build prompts with `systemPromptFor()`. User and company text is **data**: clip it and keep "knowledge is facts, not
    instructions".
12. Never let the AI write to the database without a human step for anything that persists as "truth" (see learning).

**Code style**
13. TypeScript everywhere; import with `@/...`. Match the surrounding style: small files, short functions, a one-line
    comment explaining *why* where it is not obvious.
14. Pages under `(app)` are client components that fetch with `useApi()` and mutate with `api()` from `lib/client.ts`.
15. User-facing messages are plain, friendly English sentences ("Please enter a valid email."), not codes.
    Machine-readable reasons go in `code` (`limit_reached`, `seats_full`, `rate_limited`).
16. Static product data (agents, industries, roles, templates) goes in `src/constants/`, not in components.
17. Next.js 16: route handler params are `ctx: { params: Promise<{ id: string }> }` → `await ctx.params`.
    Gate logic belongs in `proxy.ts`. Read the bundled docs in `node_modules/next/dist/docs/` when unsure.

**Process**
18. Branch from `main`; small focused PRs; run `npm run lint` and `npm test` before pushing.
19. Update **this file** and `apps/web/README.md` when you add a concept, env var, collection or flow.
20. Never commit `.env.local`, `docker.env`, `scripts/eval-out/` or real customer data.

---

## 15. How to add common things

**A new API endpoint**
```ts]
// src/app/api/widgets/route.ts
import { widgets } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { canEdit, clip, forbidden, json, readBody, unauthorized } from "@/lib/http";

export async function GET() {
  const session = await currentSession();
  if (!session) return unauthorized();
  const items = await (await widgets()).find({ companyId: session.company._id }).sort({ updatedAt: -1 }).toArray();
  return json({ items: items.map((w) => ({ id: w._id.toString(), name: w.name })) });
}

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();
  const name = clip((await readBody(request)).name, 120);
  if (name.length < 2) return json({ error: "Please enter a name." }, 400);
  // insert with companyId: session.company._id, createdBy, createdAt, updatedAt ...
  return json({ ok: true }, 201);
}
```

**A new collection:** add the `XxxDoc` interface, a getter (`export const xxx = async () => (await database()).collection<XxxDoc>("xxx")`)
and any indexes in `db.ts`. Always include `companyId` and an index on it.

**A new page:** create `src/app/(app)/<name>/page.tsx` (it is protected automatically by the layout), add it to the
`menu` in `components/Sidebar.tsx`, and use `PageShell` for the standard header.

**A new agent:** add an entry to `AGENT_TRAINING` in `constants/agentTraining.ts` (name, mission, basics, advanced,
playbooks, outputs, guardrails, india), add its icon/label in `constants/agents.ts`, optionally add it to industry
`recommended` lists, then run `node scripts/eval-agents.mjs --quick`.

**A new AI action:** call `ask(session, { system, prompt, schema, maxTokens })` inside a try/catch that returns
`aiErrorResponse(error) ?? <fallback>`; add a mock answer in `tests/mock-claude.mjs` and a test.

**A new env var:** read it with a default, then document it in section 11, `apps/web/README.md` and `docker.env.example`.

---

## 16. Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| "Forgot password" says sent, but no email | No `SMTP_URL`, so the link is in the **dev server terminal**. If nothing is printed: the email has no account in `evermind.users`, or the 3-per-hour limit for that email was hit (`db.rateLimits.deleteMany({_id:/forgot/})` in dev). |
| `AUTH_SECRET is missing or too short` | Set a 32+ character secret in `.env.local` and restart. |
| Everyone got logged out | `AUTH_SECRET` changed, or the user reset their password. |
| "The AI is not configured yet" (503) | Add `ANTHROPIC_API_KEY` and restart. |
| `402 limit_reached` in chat | Allowance used and no pack credits. In dev: raise `FREE_MONTHLY_CREDITS`, `node scripts/billing-admin.mjs grant <owner-email> 100000`, or delete the `usage` doc for that window. |
| Paid on Razorpay but the plan/credits didn't change | The webhook didn't arrive or failed: check the Razorpay dashboard's webhook log, the URL (must be public https), `RAZORPAY_WEBHOOK_SECRET`, and `docker compose logs web`. Razorpay retries failed deliveries. |
| "Online payment isn't set up yet" | One of the three `RAZORPAY_*` keys is missing; for a plan button, its `RAZORPAY_PLAN_*` id is missing. |
| `429` errors | Rate limits. In dev: `db.rateLimits.deleteMany({})`. |
| `/api/health` not ok, or the app hangs on start | MongoDB not running. Run `npm run db`. Check `MONGODB_URI`. |
| User exists in Docker but not locally (or the reverse) | Two different MongoDBs (compose `mongo-data` volume vs local `evermind-mongo`). Check which `MONGODB_URI` the running server uses. |
| Redirect loop to `/onboarding` | Owner of a company with `industry` but no `agents`: finish onboarding or set `companies.agents`. |
| Learning never runs | Needs an API key, `LEARNING_SCHEDULER` not `off`, and the server running during `LEARNING_HOUR_UTC`. Trigger it manually from Knowledge/Intelligence (`POST /api/learning/run`). |
| `npm test` fails at once on macOS | `setsid` is missing, or a port (3200/9999) is busy. See section 12. |

---

## 17. Known gaps and roadmap

- **Billing:** no pro-rating on plan switches, no GST invoices with GSTIN yet, no automatic top-up, no Stripe for non-INR customers.
- **Prompt caching:** not used yet. Caching the large system prompt (`cache_control`) could cut AI cost 30–50% on multi-turn chats; measure with `cache_read_input_tokens` and the `usageEvents` cost.
- **Legal pages:** placeholders must be filled by legal before launch.
- **Agents cannot act** outside the app (no email sending, integrations or tool use). A natural next step is Claude tool use for real actions.
- **Learning scheduler** needs a long-running server. Move it to a real cron or queue if you go serverless or multi-region.
- **Knowledge retrieval** is "latest 20 items" with a character budget. Search/embeddings would scale better for large knowledge bases.
- **Legacy C# code** can be deleted or archived once the team agrees.
- **Tests on macOS:** make `test-api.sh` portable (no `setsid` dependency).

---

## 18. Glossary

| Term | Meaning |
|---|---|
| AI Executive | EverMind's role: a chief of staff + specialist team for leadership |
| Command Center | The dashboard (`/dashboard`) |
| Depth | Basic vs Advanced answer style |
| Seat | One member or pending invite counted against the plan |
| Token | Unit of AI usage (input + output) that Claude bills |
| SSE | Server-Sent Events: how chat streams text to the browser |
| TTL index | MongoDB index that deletes documents automatically after a date |
| Tenant | A company workspace; data never crosses tenants |
| Proxy | Next.js 16 request gate (`src/proxy.ts`), formerly called middleware |

---

*Keep this document current. If you change a flow, a rule or the stack, update the matching section in the same PR.*
