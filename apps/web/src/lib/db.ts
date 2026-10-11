import { cert, getApps, initializeApp } from "firebase-admin/app";
import {
  FieldPath,
  getFirestore,
  Timestamp,
  type CollectionReference,
  type DocumentData,
  type Firestore,
  type FirestoreDataConverter,
  type Query,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import type { Role } from "@/constants/team";

/** A Firestore document id. Records migrated from MongoDB keep their old ObjectId (as hex) here. */
export type Id = string;

/** A stored document together with its id, like MongoDB's WithId. */
export type WithId<T> = T & { _id: Id };

export interface UserDoc {
  name: string;
  /** Sessions issued before this moment are no longer valid. */
  passwordChangedAt?: Date;
  /** Legacy field from before workspaces; used once to migrate. */
  companyName?: string;
  companyId?: Id;
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
  /** null until learning first ran (Firestore can't query a missing field, but it can query null). */
  lastLearningAt?: Date | null;
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

/** Id = inviteKey(companyId, email), so the same email is invited at most once per company. */
export interface InviteDoc {
  companyId: Id;
  email: string;
  role: Exclude<Role, "owner">;
  invitedBy: Id;
  createdAt: Date;
}

/** Id = the lower-case email (URL-encoded). Holds the email for one user, so two accounts can't share it. */
export interface EmailDoc {
  userId: Id;
}

export interface ProjectDoc {
  companyId: Id;
  name: string;
  description: string;
  instructions: string;
  createdBy: Id;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageDoc {
  // id: `${companyId}:${window}`, window = YYYY-MM or the date the billing month started
  companyId: Id;
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

/** Id = the company id: one open request per company. */
export interface UpgradeRequestDoc {
  companyId: Id;
  userId: Id;
  plan: string;
  note: string;
  createdAt: Date;
}

export type TaskStatus = "todo" | "doing" | "done";

export interface TaskDoc {
  companyId: Id;
  projectId?: Id;
  title: string;
  status: TaskStatus;
  assigneeId?: Id;
  due?: string; // YYYY-MM-DD
  createdBy: Id;
  createdAt: Date;
  updatedAt: Date;
}

export type DecisionStatus = "proposed" | "approved" | "rejected";

export interface DecisionDoc {
  companyId: Id;
  title: string;
  context: string;
  options: string;
  decision: string;
  status: DecisionStatus;
  aiRecommendation?: string;
  createdBy: Id;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeDoc {
  companyId: Id;
  title: string;
  content: string;
  createdBy: Id;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportDoc {
  companyId: Id;
  title: string;
  body: string;
  createdBy: Id;
  createdAt: Date;
}

export interface DailyUsageDoc {
  // id: `${companyId}:${YYYY-MM-DD}`
  companyId: Id;
  day: string;
  tokens: number;
  credits?: number;
  costMicros?: number;
}

/** One AI call: what it cost us and what it cost the customer. */
export interface UsageEventDoc {
  companyId: Id;
  userId?: Id;
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
  companyId: Id;
  source: "pack" | "admin";
  packId?: string;
  /** Gateway payment id for packs; the grant's id is key("pack", paymentId), so a repeated webhook never grants twice. */
  paymentId?: string;
  credits: number;
  remaining: number;
  note?: string;
  createdAt: Date;
  expiresAt: Date;
}

/** Id = key(gatewayPaymentId), so each payment is stored once. */
export interface PaymentDoc {
  companyId: Id;
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

/** Id = key(the gateway's event id). */
export interface BillingEventDoc {
  type: string;
  createdAt: Date;
}

/** Id = key(userId, conversationId, messageIndex): one rating per person per message. */
export interface FeedbackDoc {
  companyId: Id;
  userId: Id;
  conversationId: Id;
  messageIndex: number;
  agent?: string;
  rating: "up" | "down";
  createdAt: Date;
}

export interface LearningDoc {
  companyId: Id;
  text: string;
  status: "pending" | "approved" | "dismissed";
  createdAt: Date;
}

/** Id = sha256 of the emailed token. Deleted by a TTL policy on expiresAt. */
export interface PasswordResetDoc {
  userId: Id;
  expiresAt: Date;
}

/** The one AI connection for the whole app (id "ai"), written by scripts/set-ai-key.mjs. */
export interface AiSettingsDoc {
  provider: "anthropic" | "groq" | "gemini" | "openrouter";
  model: string;
  learningModel?: string;
  /** The API key, encrypted with AI_KEY_SECRET (AES-256-GCM, base64 parts). Never stored in plain text. */
  key: { iv: string; tag: string; data: string };
  /** Last 4 characters, so admins can tell which key is in use. */
  keyHint: string;
  updatedAt: Date;
}

/** Deleted by a TTL policy on expireAt. */
export interface RateLimitDoc {
  count: number;
  expireAt: Date;
}

/**
 * The messages live in the "messages" subcollection (a Firestore document is limited to 1 MiB,
 * which a long chat would outgrow). Message n has the id messageId(n).
 */
export interface ConversationDoc {
  agent?: string;
  depth?: "basic" | "advanced";
  projectId?: Id;
  userId: Id;
  /** The user's company, so company-wide stats don't need a query per member. */
  companyId: Id;
  title: string;
  messageCount: number;
  /** The start of the newest message, for the conversation list. */
  lastMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Connection ----

const globalForFirestore = globalThis as unknown as { firestore?: Firestore };

/**
 * With FIREBASE_PRIVATE_KEY set, signs in as that service account. Otherwise uses the default Google
 * credentials, or the emulator when FIRESTORE_EMULATOR_HOST is set (npm test, npm run dev:emulator).
 */
export function firestore(): Firestore {
  if (globalForFirestore.firestore) return globalForFirestore.firestore;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "demo-evermind";
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const app =
    getApps()[0] ??
    initializeApp(
      privateKey && !process.env.FIRESTORE_EMULATOR_HOST
        ? { projectId, credential: cert({ projectId, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey }) }
        : { projectId }
    );

  const db = process.env.FIRESTORE_DATABASE_ID ? getFirestore(app, process.env.FIRESTORE_DATABASE_ID) : getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });
  globalForFirestore.firestore = db;
  return db;
}

/** Firestore hands back Timestamps; the app works with Dates, as it did with MongoDB. */
function revive(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, revive(v)]));
  }
  return value;
}

function converter<T>(): FirestoreDataConverter<WithId<T>> {
  return {
    toFirestore(record: DocumentData) {
      const { _id, ...data } = record;
      void _id;
      return data;
    },
    fromFirestore(snap: QueryDocumentSnapshot) {
      return { ...(revive(snap.data()) as T), _id: snap.id };
    },
  };
}

export type Col<T> = CollectionReference<WithId<T>>;

const collection = <T>(name: string): Col<T> => firestore().collection(name).withConverter(converter<T>());

export const users = () => collection<UserDoc>("users");
export const emails = () => collection<EmailDoc>("emails");
export const conversations = () => collection<ConversationDoc>("conversations");
export const companies = () => collection<CompanyDoc>("companies");
export const invites = () => collection<InviteDoc>("invites");
export const projects = () => collection<ProjectDoc>("projects");
export const tasks = () => collection<TaskDoc>("tasks");
export const decisions = () => collection<DecisionDoc>("decisions");
export const knowledge = () => collection<KnowledgeDoc>("knowledge");
export const reports = () => collection<ReportDoc>("reports");
export const dailyUsage = () => collection<DailyUsageDoc>("dailyUsage");
export const feedback = () => collection<FeedbackDoc>("feedback");
export const learnings = () => collection<LearningDoc>("learnings");
export const rateLimits = () => collection<RateLimitDoc>("rateLimits");
export const passwordResets = () => collection<PasswordResetDoc>("passwordResets");
export const usage = () => collection<UsageDoc>("usage");
export const upgradeRequests = () => collection<UpgradeRequestDoc>("upgradeRequests");
export const aiSettings = () => collection<AiSettingsDoc>("settings");
export const usageEvents = () => collection<UsageEventDoc>("usageEvents");
export const creditGrants = () => collection<CreditGrantDoc>("creditGrants");
export const payments = () => collection<PaymentDoc>("payments");
export const billingEvents = () => collection<BillingEventDoc>("billingEvents");

export const messagesOf = (conversationId: Id) =>
  conversations().doc(conversationId).collection("messages").withConverter(converter<ChatMessage>());

/** Zero-padded, so the ids sort in message order. */
export const messageId = (index: number) => String(index).padStart(6, "0");

export type UserRecord = WithId<UserDoc>;
export type ConversationRecord = WithId<ConversationDoc>;
export type CompanyRecord = WithId<CompanyDoc>;
export type ProjectRecord = WithId<ProjectDoc>;

// ---- Helpers ----

/** Builds a document id from parts. Each part is URL-encoded, so ":" and "/" inside them can't clash. */
export const key = (...parts: (string | number)[]) => parts.map((p) => encodeURIComponent(String(p))).join(":");

export const emailKey = (email: string) => key(email.toLowerCase());
export const inviteKey = (companyId: Id, email: string) => key(companyId, email.toLowerCase());

/** Adds a document and returns its id. With an id given, fails (see isDuplicate) if it already exists. */
export async function insert<T>(col: Col<T>, data: T, id?: Id): Promise<Id> {
  const ref = id ? col.doc(id) : col.doc();
  await ref.create(data as WithId<T>);
  return ref.id;
}

/** True for the error Firestore gives when creating a document whose id is taken. */
export const isDuplicate = (error: unknown) => (error as { code?: number }).code === 6; // ALREADY_EXISTS

/** The document with this id, or null. With `match`, also null unless those fields are equal (e.g. { companyId }). */
export async function findById<T>(col: Col<T>, id: Id | null | undefined, match?: Partial<T>): Promise<WithId<T> | null> {
  if (!id) return null;
  const doc = (await col.doc(id).get()).data();
  if (!doc) return null;
  if (match && Object.entries(match).some(([field, value]) => (doc as Record<string, unknown>)[field] !== value)) return null;
  return doc;
}

export const findAll = async <T>(query: Query<T>): Promise<T[]> => (await query.get()).docs.map((d) => d.data());

export const findFirst = async <T>(query: Query<T>): Promise<T | null> => (await query.limit(1).get()).docs[0]?.data() ?? null;

export const countOf = async (query: Query): Promise<number> => (await query.count().get()).data().count;

/** Deletes every document the query matches (and their subcollections). */
export async function deleteAll(query: Query) {
  const db = firestore();
  const snap = await query.get();
  await Promise.all(snap.docs.map((d) => db.recursiveDelete(d.ref)));
}

/** The last `limit` messages of a conversation (all of them without a limit), oldest first. */
export async function readMessages(convo: Pick<ConversationRecord, "_id" | "messageCount">, limit?: number): Promise<ChatMessage[]> {
  // Ids are the message numbers, so the last ones start at a known id (no descending scan needed).
  let query = messagesOf(convo._id).orderBy(FieldPath.documentId());
  if (limit) query = query.startAt(messageId(Math.max(0, convo.messageCount - limit)));
  const list = await findAll(query);
  return list.map(({ role, content, createdAt }) => ({ role, content, createdAt }));
}

/** Adds a message to the end of a conversation; does nothing if the conversation was deleted meanwhile. */
export async function appendMessage(conversationId: Id, message: ChatMessage, extra: Partial<ConversationDoc> = {}) {
  const db = firestore();
  const convoRef = conversations().doc(conversationId);
  await db.runTransaction(async (tx) => {
    const convo = (await tx.get(convoRef)).data();
    if (!convo) return;
    tx.create(messagesOf(conversationId).doc(messageId(convo.messageCount)), message as WithId<ChatMessage>);
    tx.update(convoRef, {
      ...extra,
      messageCount: convo.messageCount + 1,
      lastMessage: message.content.slice(0, 2000),
      updatedAt: message.createdAt,
    });
  });
}
