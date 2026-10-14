import { adminSession } from "@/lib/admin";
import { companies, findAll, findById, upgradeRequests, users } from "@/lib/db";
import { json } from "@/lib/http";

export async function GET() {
  const { error } = await adminSession();
  if (error) return error;

  const requests = await findAll(upgradeRequests().orderBy("createdAt", "desc"));
  const rows = await Promise.all(
    requests.map(async (r) => {
      const [company, user] = await Promise.all([findById(companies(), r.companyId), findById(users(), r.userId)]);
      return {
        id: r._id,
        companyId: r.companyId,
        company: company?.name ?? r.companyId,
        currentPlan: company?.plan ?? null,
        plan: r.plan,
        note: r.note,
        requestedBy: user ? { name: user.name, email: user.email } : null,
        createdAt: r.createdAt,
      };
    })
  );

  return json({ requests: rows });
}
