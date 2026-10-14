import { adminSession } from "@/lib/admin";
import { companies, findById, upgradeRequests } from "@/lib/db";
import { docId, json, readBody } from "@/lib/http";
import { PLANS, type PlanId } from "@/lib/plans";

type Ctx = { params: Promise<{ id: string }> };

/** Changes a company's plan by hand (no payment), and closes its upgrade request. */
export async function PATCH(request: Request, ctx: Ctx) {
  const { error } = await adminSession();
  if (error) return error;

  const company = await findById(companies(), docId((await ctx.params).id));
  if (!company) return json({ error: "Not found." }, 404);

  const plan = String((await readBody(request)).plan ?? "");
  if (!(plan in PLANS)) return json({ error: "Plan must be free, pro or business." }, 400);

  await companies().doc(company._id).update({ plan: plan as PlanId });
  await upgradeRequests().doc(company._id).delete();

  const warning =
    company.billing?.status === "active"
      ? "This company also has an active online subscription; its next payment webhook may change the plan back."
      : null;
  return json({ ok: true, warning });
}
