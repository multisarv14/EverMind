import { ObjectId } from "mongodb";
import { can } from "@/constants/team";
import type { Session } from "@/lib/auth";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export const unauthorized = () => json({ error: "Please sign in." }, 401);

export const forbidden = (message = "You don't have permission to do that.") => json({ error: message }, 403);

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Members and above can create and edit work (projects, tasks, decisions, knowledge). */
export const canEdit = (session: Session) => can(session.role, "createProject");

export const oid = (value: unknown): ObjectId | null =>
  typeof value === "string" && ObjectId.isValid(value) ? new ObjectId(value) : null;

export const clip = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);
