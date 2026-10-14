import { adminSession, isPlatformAdmin } from "@/lib/admin";
import { companies, findAll, users } from "@/lib/db";
import { json } from "@/lib/http";

const LIMIT = 1000;

export async function GET() {
  const { error } = await adminSession();
  if (error) return error;

  const [people, list] = await Promise.all([findAll(users().orderBy("createdAt", "desc").limit(LIMIT)), findAll(companies())]);
  const names = new Map(list.map((c) => [c._id, c.name]));

  // Never send password hashes to the browser.
  const rows = people.map((u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role ?? null,
    companyId: u.companyId ?? null,
    company: u.companyId ? (names.get(u.companyId) ?? null) : null,
    platformAdmin: isPlatformAdmin(u),
    createdAt: u.createdAt,
    passwordChangedAt: u.passwordChangedAt ?? null,
  }));

  return json({ users: rows, truncated: people.length === LIMIT });
}
