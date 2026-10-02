import type { ObjectId } from "mongodb";
import { usage } from "@/lib/db";

const month = () => new Date().toISOString().slice(0, 7);
const keyFor = (companyId: ObjectId) => `${companyId.toString()}:${month()}`;

export async function tokensUsed(companyId: ObjectId): Promise<number> {
  const doc = await (await usage()).findOne({ _id: keyFor(companyId) });
  return doc?.tokens ?? 0;
}

export async function addTokens(companyId: ObjectId, tokens: number) {
  if (!Number.isFinite(tokens) || tokens <= 0) return;
  await (await usage()).updateOne(
    { _id: keyFor(companyId) },
    { $inc: { tokens: Math.round(tokens) }, $setOnInsert: { companyId, month: month() } },
    { upsert: true }
  );
}
