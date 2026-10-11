import { timingSafeEqual } from "node:crypto";
import { json } from "@/lib/http";
import { runDueLearning } from "@/lib/learningScheduler";

export const maxDuration = 300;

const sameSecret = (given: string, expected: string) =>
  given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));

// The nightly learning job, for hosts where the server sleeps between requests (Firebase App Hosting).
// A daily Cloud Scheduler job calls it with "Authorization: Bearer <CRON_SECRET>".
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) return json({ error: "Not found." }, 404);
  const given = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!sameSecret(given, secret)) return json({ error: "Not found." }, 404);

  return json({ ok: true, learned: await runDueLearning() });
}
