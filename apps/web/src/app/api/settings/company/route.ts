import { companies } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { can, TEAM_SIZES } from "@/constants/team";
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
  if (Object.keys(set).length === 0) return json({ error: "Nothing to update." }, 400);

  await (await companies()).updateOne({ _id: session.company._id }, { $set: set });
  return json({ ok: true });
}
