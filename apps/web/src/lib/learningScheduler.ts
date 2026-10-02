import { companies } from "@/lib/db";
import { runLearning } from "@/lib/learning";

const HOUR = 60 * 60 * 1000;
const g = globalThis as { __learningTimer?: ReturnType<typeof setInterval> };

async function tick() {
  // Run once a day, in one chosen UTC hour (default 21:00 UTC = 02:30 India time).
  if (new Date().getUTCHours() !== Number(process.env.LEARNING_HOUR_UTC ?? 21)) return;

  const col = await companies();
  const due = await col
    .find({ $or: [{ lastLearningAt: { $exists: false } }, { lastLearningAt: { $lt: new Date(Date.now() - 20 * HOUR) } }] })
    .limit(50)
    .toArray();

  for (const company of due) {
    // Claim the company first so two server instances never learn for it at once.
    const claimed = await col.findOneAndUpdate(
      { _id: company._id, $or: [{ lastLearningAt: { $exists: false } }, { lastLearningAt: { $lt: new Date(Date.now() - 20 * HOUR) } }] },
      { $set: { lastLearningAt: new Date() } },
      { returnDocument: "before" }
    );
    if (!claimed) continue;
    try {
      // Learn from everything since the previous run (claimed.lastLearningAt before the claim).
      await runLearning({ ...company, lastLearningAt: claimed.lastLearningAt });
    } catch (error) {
      console.error(`learning failed for ${company.name}:`, error instanceof Error ? error.message : error);
    }
  }
}

/** Starts the nightly "what did EverMind learn today" job inside the running server. */
export function startLearningScheduler() {
  if (g.__learningTimer) return;
  if (process.env.LEARNING_SCHEDULER === "off" || !process.env.ANTHROPIC_API_KEY) return;
  const run = () => void tick().catch((e) => console.error("learning tick failed:", e));
  g.__learningTimer = setInterval(run, HOUR);
  // Also check shortly after start, so a restart never skips the nightly window.
  setTimeout(run, 60_000);
}
