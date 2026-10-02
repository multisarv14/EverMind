import type { ObjectId } from "mongodb";
import { dailyUsage, usage } from "@/lib/db";

const month = () => new Date().toISOString().slice(0, 7);
const keyFor = (companyId: ObjectId) => `${companyId.toString()}:${month()}`;

export async function tokensUsed(companyId: ObjectId): Promise<number> {
  const doc = await (await usage()).findOne({ _id: keyFor(companyId) });
  return doc?.tokens ?? 0;
}

export async function addTokens(companyId: ObjectId, tokens: number) {
  if (!Number.isFinite(tokens) || tokens <= 0) return;
  const amount = Math.round(tokens);
  await (await usage()).updateOne(
    { _id: keyFor(companyId) },
    { $inc: { tokens: amount }, $setOnInsert: { companyId, month: month() } },
    { upsert: true }
  );
  const day = new Date().toISOString().slice(0, 10);
  await (await dailyUsage()).updateOne(
    { _id: `${companyId.toString()}:${day}` },
    { $inc: { tokens: amount }, $setOnInsert: { companyId, day } },
    { upsert: true }
  );
}
