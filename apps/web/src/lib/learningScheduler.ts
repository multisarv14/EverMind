import { companies, findAll, firestore } from "@/lib/db";
import { runLearning } from "@/lib/learning";
import { aiConfig } from "@/lib/llm";

const HOUR = 60 * 60 * 1000;
const g = globalThis as { __learningTimer?: ReturnType<typeof setInterval> };

async function tick() {
  // Run once a day, in one chosen UTC hour (default 21:00 UTC = 02:30 India time).
  if (new Date().getUTCHours() !== Number(process.env.LEARNING_HOUR_UTC ?? 21)) return;
  await runDueLearning();
}

/**
 * Learns for every company that hasn't in the last 20 hours. Called by the in-process timer, or by
 * POST /api/cron/learning on hosts where the server sleeps between requests (Firebase App Hosting).
 * Returns how many companies it learned for.
 */
export async function runDueLearning(): Promise<number> {
  // The AI can be connected or removed while the server runs, so check each time.
  if (!(await aiConfig())) return 0;

  const col = companies();
  const isDue = (last?: Date | null) => !last || last < new Date(Date.now() - 20 * HOUR);
  // Companies that never learned have lastLearningAt null (Firestore can't match a missing field).
  const [never, stale] = await Promise.all([
    findAll(col.where("lastLearningAt", "==", null).limit(50)),
    findAll(col.where("lastLearningAt", "<", new Date(Date.now() - 20 * HOUR)).limit(50)),
  ]);
  const due = [...never, ...stale].slice(0, 50);
  let learned = 0;

  for (const company of due) {
    // Claim the company first so two server instances never learn for it at once.
    const ref = col.doc(company._id);
    const previous = await firestore().runTransaction(async (tx) => {
      const current = (await tx.get(ref)).data();
      if (!current || !isDue(current.lastLearningAt)) return undefined;
      tx.update(ref, { lastLearningAt: new Date() });
      return { lastLearningAt: current.lastLearningAt ?? null };
    });
    if (!previous) continue;
    try {
      // Learn from everything since the previous run (lastLearningAt before the claim).
      await runLearning({ ...company, lastLearningAt: previous.lastLearningAt });
      learned++;
    } catch (error) {
      console.error(`learning failed for ${company.name}:`, error instanceof Error ? error.message : error);
    }
  }
  return learned;
}

/** Starts the nightly "what did EverMind learn today" job inside the running server. */
export function startLearningScheduler() {
  if (g.__learningTimer) return;
  if (process.env.LEARNING_SCHEDULER === "off") return;
  const run = () => void tick().catch((e) => console.error("learning tick failed:", e));
  g.__learningTimer = setInterval(run, HOUR);
  // Also check shortly after start, so a restart never skips the nightly window.
  setTimeout(run, 60_000);
}
