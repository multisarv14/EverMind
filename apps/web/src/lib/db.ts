import { MongoClient, type Collection, type ObjectId, type WithId } from "mongodb";
import type { Role } from "@/constants/team";

export interface UserDoc {
  name: string;
  /** Sessions issued before this moment are no longer valid. */
  passwordChangedAt?: Date;
  /** Legacy field from before workspaces; used once to migrate. */
  companyName?: string;
  companyId?: ObjectId;
  role?: Role;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export type BillingStatus = "active" | "past_due" | "cancelled";

/** The company's paid subscription, kept up to date by the payment gateway's webhooks. */
export interface BillingInfo {
  status: BillingStatus;
  interval: "monthly" | "yearly";
  subscriptionId: string;
  /** Start of the paid period; monthly credit allowances are counted from this date. */
  periodStart?: Date;
  periodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  /** After a failed renewal the paid plan keeps working until this moment. */
  graceUntil?: Date;
}

export interface CompanyDoc {
  billing?: BillingInfo;
  lastLearningAt?: Date;
  industry?: string;
  /** What the company does, in the owner's words. */
  about?: string;
  /** Enabled specialist agents. Missing = all of them. */
  agents?: string[];
  name: string;
  teamSize: string;
  plan: string;
  createdAt: Date;
}

export interface InviteDoc {
  companyId: ObjectId;
  email: string;
  role: Exclude<Role, "owner">;
  invitedBy: ObjectId;
  createdAt: Date;
}

export interface ProjectDoc {
  companyId: ObjectId;
  name: string;
  description: string;
  instructions: string;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageDoc {
  _id: string; // `${companyId}:${window}`, window = YYYY-MM or the date the billing month started
  companyId: ObjectId;
  month: string;
  /** Raw input + output tokens. */
  tokens: number;
  /** Credits used in this window (absent on records from before credits existed). */
  credits?: number;
  costMicros?: number;
  /** Set once the 80% / 100% emails for this window were sent. */
  warned80?: boolean;
  warned100?: boolean;
}

export interface UpgradeRequestDoc {
  companyId: ObjectId;
  userId: ObjectId;
  plan: string;
  note: string;
  createdAt: Date;
}

export type TaskStatus = "todo" | "doing" | "done";

export interface TaskDoc {
  companyId: ObjectId;
  projectId?: ObjectId;
  title: string;
  status: TaskStatus;
  assigneeId?: ObjectId;
  due?: string; // YYYY-MM-DD
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type DecisionStatus = "proposed" | "approved" | "rejected";

export interface DecisionDoc {
  companyId: ObjectId;
  title: string;
  context: string;
  options: string;
  decision: string;
  status: DecisionStatus;
  aiRecommendation?: string;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeDoc {
  companyId: ObjectId;
  title: string;
  content: string;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportDoc {
  companyId: ObjectId;
  title: string;
  body: string;
  createdBy: ObjectId;
  createdAt: Date;
}

export interface DailyUsageDoc {
  _id: string; // `${companyId}:${YYYY-MM-DD}`
  companyId: ObjectId;
  day: string;
  tokens: number;
  credits?: number;
  costMicros?: number;
}

/** One AI call: what it cost us and what it cost the customer. */
export interface UsageEventDoc {
  companyId: ObjectId;
  userId?: ObjectId;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  costMicros: number;
  credits: number;
  /** True when the reply was stopped and the cost is an estimate. */
  estimated?: boolean;
  createdAt: Date;
}

/** Extra credits (a purchased pack or an admin grant), used after the monthly allowance. */
export interface CreditGrantDoc {
  companyId: ObjectId;
  source: "pack" | "admin";
  packId?: string;
  /** Gateway payment id for packs; unique, so a repeated webhook never grants twice. */
  paymentId?: string;
  credits: number;
  remaining: number;
  note?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface PaymentDoc {
  companyId: ObjectId;
  kind: "subscription" | "pack";
  plan?: string;
  packId?: string;
  /** Amount in paise, as charged (GST included). */
  amount: number;
  currency: string;
  status: "captured" | "failed";
  gatewayPaymentId: string;
  createdAt: Date;
}

export interface BillingEventDoc {
  _id: string; // the gateway's event id
  type: string;
  createdAt: Date;
}

export interface FeedbackDoc {
  companyId: ObjectId;
  userId: ObjectId;
  conversationId: ObjectId;
  messageIndex: number;
  agent?: string;
  rating: "up" | "down";
  createdAt: Date;
}

export interface LearningDoc {
  companyId: ObjectId;
  text: string;
  status: "pending" | "approved" | "dismissed";
  createdAt: Date;
}

export interface PasswordResetDoc {
  _id: string; // sha256 of the emailed token
  userId: ObjectId;
  expiresAt: Date;
}

export interface RateLimitDoc {
  _id: string;
  count: number;
  expireAt: Date;
}

export interface ConversationDoc {
  agent?: string;
  depth?: "basic" | "advanced";
  projectId?: ObjectId;
  userId: ObjectId;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/evermind";

// Reuse one client across hot reloads in dev.
const globalForMongo = globalThis as unknown as {
  mongo?: Promise<MongoClient>;
  indexed?: boolean;
};

function client() {
  if (!globalForMongo.mongo) {
    const connecting = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 }).connect();
    globalForMongo.mongo = connecting;
    // If the database was unreachable, forget the failed attempt so the next request retries
    // instead of reusing a dead connection until the server restarts.
    connecting.catch(() => {
      if (globalForMongo.mongo === connecting) globalForMongo.mongo = undefined;
      globalForMongo.indexed = false;
    });
  }
  return globalForMongo.mongo;
}

async function database() {
  const db = (await client()).db();
  if (!globalForMongo.indexed) {
    await Promise.all([
      db.collection<UserDoc>("users").createIndex({ email: 1 }, { unique: true }),
      db.collection<UserDoc>("users").createIndex({ companyId: 1 }),
      db.collection<ConversationDoc>("conversations").createIndex({ userId: 1, updatedAt: -1 }),
      db.collection<InviteDoc>("invites").createIndex({ email: 1 }),
      db.collection<InviteDoc>("invites").createIndex({ companyId: 1, email: 1 }, { unique: true }),
      db.collection<ProjectDoc>("projects").createIndex({ companyId: 1, updatedAt: -1 }),
      db.collection<TaskDoc>("tasks").createIndex({ companyId: 1, updatedAt: -1 }),
      db.collection<DecisionDoc>("decisions").createIndex({ companyId: 1, updatedAt: -1 }),
      db.collection<KnowledgeDoc>("knowledge").createIndex({ companyId: 1, updatedAt: -1 }),
      db.collection<ReportDoc>("reports").createIndex({ companyId: 1, createdAt: -1 }),
      db.collection<FeedbackDoc>("feedback").createIndex({ userId: 1, conversationId: 1, messageIndex: 1 }, { unique: true }),
      db.collection<FeedbackDoc>("feedback").createIndex({ companyId: 1, createdAt: -1 }),
      db.collection<LearningDoc>("learnings").createIndex({ companyId: 1, status: 1, createdAt: -1 }),
      db.collection<RateLimitDoc>("rateLimits").createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection<PasswordResetDoc>("passwordResets").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection<PasswordResetDoc>("passwordResets").createIndex({ userId: 1 }),
      db.collection<UsageEventDoc>("usageEvents").createIndex({ companyId: 1, createdAt: -1 }),
      db.collection<CreditGrantDoc>("creditGrants").createIndex({ companyId: 1, expiresAt: 1 }),
      db.collection<CreditGrantDoc>("creditGrants").createIndex({ paymentId: 1 }, { unique: true, partialFilterExpression: { paymentId: { $type: "string" } } }),
      db.collection<PaymentDoc>("payments").createIndex({ gatewayPaymentId: 1 }, { unique: true }),
      db.collection<PaymentDoc>("payments").createIndex({ companyId: 1, createdAt: -1 }),
      db.collection("companies").createIndex({ "billing.subscriptionId": 1 }, { sparse: true }),
    ]);
    globalForMongo.indexed = true;
  }
  return db;
}

export const users = async (): Promise<Collection<UserDoc>> => (await database()).collection<UserDoc>("users");
export const conversations = async (): Promise<Collection<ConversationDoc>> =>
  (await database()).collection<ConversationDoc>("conversations");
export const companies = async (): Promise<Collection<CompanyDoc>> =>
  (await database()).collection<CompanyDoc>("companies");
export const invites = async (): Promise<Collection<InviteDoc>> =>
  (await database()).collection<InviteDoc>("invites");
export const projects = async (): Promise<Collection<ProjectDoc>> =>
  (await database()).collection<ProjectDoc>("projects");
export const tasks = async (): Promise<Collection<TaskDoc>> =>
  (await database()).collection<TaskDoc>("tasks");
export const decisions = async (): Promise<Collection<DecisionDoc>> =>
  (await database()).collection<DecisionDoc>("decisions");
export const knowledge = async (): Promise<Collection<KnowledgeDoc>> =>
  (await database()).collection<KnowledgeDoc>("knowledge");
export const reports = async (): Promise<Collection<ReportDoc>> =>
  (await database()).collection<ReportDoc>("reports");
export const dailyUsage = async (): Promise<Collection<DailyUsageDoc>> =>
  (await database()).collection<DailyUsageDoc>("dailyUsage");
export const feedback = async (): Promise<Collection<FeedbackDoc>> =>
  (await database()).collection<FeedbackDoc>("feedback");
export const learnings = async (): Promise<Collection<LearningDoc>> =>
  (await database()).collection<LearningDoc>("learnings");
export const rateLimits = async (): Promise<Collection<RateLimitDoc>> =>
  (await database()).collection<RateLimitDoc>("rateLimits");
export const passwordResets = async (): Promise<Collection<PasswordResetDoc>> =>
  (await database()).collection<PasswordResetDoc>("passwordResets");
export const usage = async (): Promise<Collection<UsageDoc>> =>
  (await database()).collection<UsageDoc>("usage");
export const upgradeRequests = async (): Promise<Collection<UpgradeRequestDoc>> =>
  (await database()).collection<UpgradeRequestDoc>("upgradeRequests");

export const usageEvents = async (): Promise<Collection<UsageEventDoc>> =>
  (await database()).collection<UsageEventDoc>("usageEvents");
export const creditGrants = async (): Promise<Collection<CreditGrantDoc>> =>
  (await database()).collection<CreditGrantDoc>("creditGrants");
export const payments = async (): Promise<Collection<PaymentDoc>> =>
  (await database()).collection<PaymentDoc>("payments");
export const billingEvents = async (): Promise<Collection<BillingEventDoc>> =>
  (await database()).collection<BillingEventDoc>("billingEvents");

export type UserRecord = WithId<UserDoc>;
export type ConversationRecord = WithId<ConversationDoc>;
export type CompanyRecord = WithId<CompanyDoc>;
export type ProjectRecord = WithId<ProjectDoc>;
