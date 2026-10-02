import { MongoClient, type Collection, type ObjectId, type WithId } from "mongodb";
import type { Role } from "@/constants/team";

export interface UserDoc {
  name: string;
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

export interface CompanyDoc {
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
  _id: string; // `${companyId}:${YYYY-MM}`
  companyId: ObjectId;
  month: string;
  tokens: number;
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
}

export interface ConversationDoc {
  agent?: string;
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
  globalForMongo.mongo ??= new MongoClient(uri).connect();
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
export const usage = async (): Promise<Collection<UsageDoc>> =>
  (await database()).collection<UsageDoc>("usage");
export const upgradeRequests = async (): Promise<Collection<UpgradeRequestDoc>> =>
  (await database()).collection<UpgradeRequestDoc>("upgradeRequests");

export type UserRecord = WithId<UserDoc>;
export type ConversationRecord = WithId<ConversationDoc>;
export type CompanyRecord = WithId<CompanyDoc>;
export type ProjectRecord = WithId<ProjectDoc>;
