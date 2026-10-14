import { adminSession } from "@/lib/admin";
import { monthOf, monthReport } from "@/lib/adminData";
import { companies, countOf, upgradeRequests, users } from "@/lib/db";
import { json } from "@/lib/http";

export async function GET() {
  const { error } = await adminSession();
  if (error) return error;

  const [companyCount, userCount, pro, business, requests, report] = await Promise.all([
    countOf(companies()),
    countOf(users()),
    countOf(companies().where("plan", "==", "pro")),
    countOf(companies().where("plan", "==", "business")),
    countOf(upgradeRequests()),
    monthReport(monthOf(null)),
  ]);

  const sum = (k: "calls" | "credits" | "aiCostInr" | "revenueInr") => report.rows.reduce((s, r) => s + r[k], 0);

  return json({
    companies: companyCount,
    users: userCount,
    plans: { free: companyCount - pro - business, pro, business },
    upgradeRequests: requests,
    month: {
      month: report.month,
      calls: sum("calls"),
      credits: sum("credits"),
      aiCostInr: Math.round(sum("aiCostInr") * 100) / 100,
      revenueInr: Math.round(sum("revenueInr") * 100) / 100,
    },
  });
}
