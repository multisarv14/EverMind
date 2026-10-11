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

/** A document id from a request, or null when it can't be one (Firestore ids: up to 1500 bytes, no "/", not "." or ".."). */
export const docId = (value: unknown): string | null =>
  typeof value === "string" && /^[^/]{1,200}$/.test(value) && value !== "." && value !== ".." && !/^__.*__$/.test(value)
    ? value
    : null;

export const clip = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);
