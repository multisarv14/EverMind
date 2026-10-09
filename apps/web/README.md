# EverMind (web app)

EverMind is an AI Executive for companies: a chat with 12 specialist agents, projects, tasks, decisions,
company knowledge, reports and analytics, with team roles and a free plan.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · MongoDB · Claude (Anthropic API).

## Run it locally

You need Node 20+ and Docker.

```bash
# 1. MongoDB
docker run -d --name evermind-mongo --restart unless-stopped -p 27017:27017 -v evermind-mongo:/data/db mongo:7

# 2. Install
cd apps/web
npm ci

# 3. Configure (create apps/web/.env.local — it is git-ignored)
cat > .env.local <<'ENV'
MONGODB_URI=mongodb://localhost:27017/evermind
AUTH_SECRET=<a random string of 32+ characters>
ANTHROPIC_API_KEY=<your Anthropic key>
ANTHROPIC_MODEL=claude-opus-5-5
ENV

# 4. Start
npm run dev:all      # makes sure MongoDB is running, then starts the app on http://localhost:3000
```

`npm run db` alone (re)starts the MongoDB container if Docker stopped it. Your data lives in the
`evermind-mongo` Docker volume, so a recreated container keeps everything.

Generate a secret with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Connecting the AI (key stored encrypted in the database)

The AI key is not kept in the code or in `.env.local`. It is saved, encrypted, in MongoDB:

```bash
# once: the secret that encrypts the key (keep it safe; if it is lost, just save the key again)
echo "AI_KEY_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env.local

node --env-file=.env.local scripts/set-ai-key.mjs set groq          # asks for the key, tests it, saves it
node --env-file=.env.local scripts/set-ai-key.mjs set anthropic     # later: switch to Claude (same command)
node --env-file=.env.local scripts/set-ai-key.mjs show              # which provider / model / key is in use
```

Providers: `groq`, `gemini`, `openrouter`, `anthropic`; an optional model id follows the provider. The running app
switches within 30 seconds. With no saved key, `ANTHROPIC_API_KEY` from the environment is used, as before.

Without an AI key everything except the AI features works (tasks, decisions log, knowledge,
report data, analytics, team, settings). AI features show a clear "AI is not configured" message.

## Settings (environment variables)

| Variable | Default | What it does |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/evermind` | Database connection |
| `AUTH_SECRET` | — (required, 32+ chars) | Signs login cookies |
| `AI_KEY_SECRET` | — | Encrypts the AI key saved with `scripts/set-ai-key.mjs` (32+ chars) |
| `ANTHROPIC_API_KEY` | — | Turns on the AI when no key is saved in the database |
| `ANTHROPIC_MODEL` | `claude-opus-5-5` | Model for chat and AI actions. A cheaper model (e.g. `claude-sonnet-5-5`) cuts cost roughly in half |
| `ANTHROPIC_LEARNING_MODEL` | same as above | Model for the nightly learning job |
| `FREE_MONTHLY_CREDITS` | `50000` | AI credit allowance per company per month on the Free plan (`FREE_MONTHLY_TOKENS` still works) |
| `FREE_SEATS` | `3` | Team members allowed on the Free plan |
| `APP_URL` | the request's address | Public address of the site, used for links in emails and in sitemap/robots |
| `SMTP_URL` | — | Turns on real emails (invitations, password reset), e.g. `smtp://user:pass@smtp.example.com:587`. Without it nothing is sent; in development the email is printed in the server console |
| `MAIL_FROM` | `EverMind <no-reply@localhost>` | The "from" address of emails |
| `SIGNUP_LIMIT_PER_HOUR` | `15` | Sign-ups allowed per IP address per hour |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | — | Turn on online payments (plans and credit packs). Without them, "Upgrade" records a request |
| `RAZORPAY_PLAN_PRO_MONTHLY` / `_PRO_YEARLY` / `_BUSINESS_MONTHLY` / `_BUSINESS_YEARLY` | — | Razorpay plan ids for each paid plan |
| `LEARNING_SCHEDULER` | on | Set to `off` to disable the nightly learning job |
| `LEARNING_HOUR_UTC` | `21` | Hour (UTC) when the nightly job runs (21 = 02:30 India) |

## What is where

- `src/app/(marketing)` public home page · `src/app/(auth)` login and sign-up · `src/app/(app)` the signed-in app
- `src/app/api` JSON API (auth, chat streaming, projects, tasks, decisions, knowledge, reports, analytics, team, plan, learning)
- `src/constants/agentTraining.ts` the training for the 12 agents (foundations, advanced toolkit, playbooks, guardrails)
- `src/constants/industries.ts` company types and which agents each type is recommended (shown when a company signs up)
- `src/lib/persona.ts` builds the system prompt (company, project, agent, depth, knowledge)
- `src/lib/learning.ts` + `learningScheduler.ts` the daily "what did EverMind learn" job (suggestions need owner approval)
- `scripts/eval-agents.mjs` checks the quality of every agent (spends real tokens, see below)

## Run the tests

```bash
npm test
```

Starts a throw-away database and a fake Claude and Razorpay (no real key, no cost), runs 20 checks of sign-up, login, password reset,
team roles, company isolation, chat, learning, reports, credits, subscriptions and credit packs, then cleans up. Needs ports 3200 and 9999 free.

## Deploy

The app is a standard Next.js server plus MongoDB. A `Dockerfile` (small, non-root image) and a `docker-compose.yml`
(app + MongoDB with a data volume) are included:

```bash
cp apps/web/docker.env.example apps/web/docker.env   # then fill in AUTH_SECRET, ANTHROPIC_API_KEY, APP_URL, SMTP_URL
docker compose up -d --build                         # app on http://localhost:3000
```

`GET /api/health` answers `{"ok":true}` when the app can reach the database; use it for uptime monitoring.
For real use, put it behind HTTPS (the app sends HSTS in production), use a managed MongoDB (e.g. Atlas) or back up the
`mongo-data` volume, and keep the server running so the nightly learning job can run.

## Check agent quality

```bash
FREE_MONTHLY_TOKENS=1000000 npm run dev      # in one terminal
node scripts/eval-agents.mjs --quick         # in another (one question per agent)
```

Answers are saved to `scripts/eval-out/` so you can read them.

## Notes

- The nightly learning job only runs while the server is running (it does not run on serverless hosts or a sleeping Codespace).
- Login and sign-up are rate-limited (MongoDB-backed).
- Plans, prices and credit packs live in `src/lib/plans.ts`; model costs and credits in `src/lib/pricing.ts`. Payments go through
  Razorpay when its keys are set (see `docs/ONBOARDING.md`, "Billing"); `node scripts/billing-admin.mjs report` compares revenue with AI cost.
- The older C# prototype in `apps/api` is not used by this app.
