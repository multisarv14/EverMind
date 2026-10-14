import { adminSession } from "@/lib/admin";
import { companies, creditGrants, findById, insert } from "@/lib/db";
import { clip, docId, json, readBody } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

const MAX_GRANT = 100_000_000;

/** Gives a company free credits, valid for 12 months and used after its monthly allowance. */
export async function POST(request: Request, ctx: Ctx) {
  const { session, error } = await adminSession();
  if (error) return error;

  const company = await findById(companies(), docId((await ctx.params).id));
  if (!company) return json({ error: "Not found." }, 404);

  const body = await readBody(request);
  const credits = Math.round(Number(body.credits));
  if (!(credits > 0 && credits <= MAX_GRANT)) return json({ error: `Give between 1 and ${MAX_GRANT.toLocaleString()} credits.` }, 400);

  const note = clip(body.note, 200);
  const now = new Date();
  await insert(creditGrants(), {
    companyId: company._id,
    source: "admin",
    credits,
    remaining: credits,
    note: [note, `by ${session.user.email}`].filter(Boolean).join(" · "),
    createdAt: now,
    expiresAt: new Date(now.getTime() + 365 * 86_400_000),
  });

  return json({ ok: true }, 201);
}
