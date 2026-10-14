import { adminSession } from "@/lib/admin";
import { monthOf, monthReport } from "@/lib/adminData";
import { json } from "@/lib/http";

export async function GET(request: Request) {
  const { error } = await adminSession();
  if (error) return error;

  return json(await monthReport(monthOf(new URL(request.url).searchParams.get("month"))));
}
