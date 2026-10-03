# Ticket: Deploy EverMind (apps/web) to a live server

**Type:** Task  **Priority:** High  **Assignee:** Developer / DevOps

## Goal
Run EverMind on a public HTTPS address (for example `https://app.<our-domain>`), with a working database, email and backups. We will add the Claude API key afterwards, in a second step.

## What is already built
- A Next.js 16 app in `apps/web` with a production `Dockerfile` (standalone build, non-root user, healthcheck).
- `docker-compose.yml` at the repo root. It starts the app and MongoDB 7 together. Data lives in the `mongo-data` volume.
- `GET /api/health` returns `{"ok":true}`. Use it for uptime checks.
- Automated tests: `cd apps/web && npm test`. They use a throw-away DB and a fake Claude, and 17 of 17 pass.
- Nightly learning runs inside the app process (`instrumentation.ts`). No separate cron is needed.
- `apps/api` (C#) and the other C# folders are the old backend and are not used. Do not deploy them.

## Tasks
1. **Server:** a Linux VM with Docker and Docker Compose. 1 vCPU and 2 GB RAM is enough to start.
2. **Config:** `cp apps/web/docker.env.example apps/web/docker.env` and fill in:
   - `AUTH_SECRET`: a random string of 32 or more characters (`openssl rand -hex 32`). Never change it later, or everyone is logged out.
   - `APP_URL`: the final public https address.
   - `SMTP_URL` and `MAIL_FROM`: real SMTP, for invitations and password reset. Without SMTP, emails are only printed in the logs.
   - `ANTHROPIC_API_KEY`: **leave blank for now.** We add it in phase 2.
   - Optional: `FREE_MONTHLY_TOKENS` (default 50000), `FREE_SEATS`, `LEARNING_HOUR_UTC` (default 21).
3. **Run:** `docker compose up -d --build`, then check `curl localhost:3000/api/health`.
4. **HTTPS and domain:** put Caddy or Nginx in front, proxying to port 3000, with a Let's Encrypt certificate. Note that cookies and links need https.
5. **Database:** choose one.
   - (a) The bundled MongoDB container. Do not expose port 27017 publicly.
   - (b) MongoDB Atlas, using a `mongodb+srv://...` URI with the database name `/evermind`. The free M0 tier is fine for the pilot. Set `MONGODB_URI` for the `web` service accordingly and remove the `mongo` service.
6. **Backups:** a daily `mongodump` kept for 7 days or more, stored off the server. Test one restore.
7. **Firewall:** open only ports 80 and 443 (and SSH from our IPs).
8. **Logs and uptime:** `docker compose logs -f web` must be readable, and an uptime monitor must watch `/api/health`.

## Acceptance checks
- [ ] The site opens on https and the landing page loads.
- [ ] Sign up with a new company works, and the Command Center opens.
- [ ] Log out and log in works. A refresh keeps the session.
- [ ] "Forgot password" delivers a real email.
- [ ] Team invite delivers a real email.
- [ ] `/api/health` returns ok, and a restart of the containers keeps the data.
- [ ] A backup file exists and a restore into a test DB works.
- [ ] Chat shows a clear "AI is not connected yet" style message and nothing crashes, because the key is blank.

## Notes for the developer
- Required env vars: `MONGODB_URI`, `AUTH_SECRET`. The rest have defaults.
- The Terms and Privacy pages still contain placeholders (`[company name]`, `[support email]`, `[city]`, `[date]`). Legal must review and fill them before launch.
- Never commit `docker.env` or `.env.local`.

## Phase 2 (after this ticket)
Add `ANTHROPIC_API_KEY`, restart the `web` service, and run `node scripts/eval-agents.mjs --quick` to check the agent answers.
