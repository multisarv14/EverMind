import { companies } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { can, TEAM_SIZES } from "@/constants/team";
import { INDUSTRIES } from "@/constants/industries";
import { clip, forbidden, json, readBody, unauthorized } from "@/lib/http";

export async function PATCH(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!can(session.role, "manageBilling")) return forbidden("Only the owner can change company details.");

  const body = await readBody(request);
  const set: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = clip(body.name, 100).replace(/\s+/g, " ");
    if (name.length < 2) return json({ error: "Please enter your company name." }, 400);
    set.name = name;
  }
  if (body.teamSize !== undefined) {
    if (!(TEAM_SIZES as readonly string[]).includes(String(body.teamSize))) return json({ error: "Invalid team size." }, 400);
    set.teamSize = String(body.teamSize);
  }
  if (body.industry !== undefined) {
    if (!INDUSTRIES.some((i) => i.id === String(body.industry))) return json({ error: "Invalid company type." }, 400);
    set.industry = String(body.industry);
  }
  if (body.about !== undefined) set.about = clip(body.about, 400).replace(/\s+/g, " ");
  if (Object.keys(set).length === 0) return json({ error: "Nothing to update." }, 400);

  await companies().doc(session.company._id).update(set);
  return json({ ok: true });
}
