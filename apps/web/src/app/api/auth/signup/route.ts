import bcrypt from "bcryptjs";
import { companies, emailKey, emails, findFirst, firestore, invites, isDuplicate, users } from "@/lib/db";
import { startSession } from "@/lib/auth";
import { json, readBody } from "@/lib/http";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/ratelimit";
import { TEAM_SIZES } from "@/constants/team";
import { INDUSTRIES } from "@/constants/industries";

export async function POST(request: Request) {
  const limited = await rateLimit(`signup:ip:${clientIp(request)}`, Number(process.env.SIGNUP_LIMIT_PER_HOUR ?? 15), 3600);
  if (!limited.ok) return tooManyRequests(limited.retryAfter);

  const body = await readBody(request);
  const companyName = String(body.companyName ?? "").trim().replace(/\s+/g, " ");
  const teamSize = String(body.teamSize ?? "");
  const industry = String(body.industry ?? "");
  const about = String(body.about ?? "").trim().replace(/\s+/g, " ").slice(0, 400);
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const joining = body.joining === true;

  if (name.length < 2 || name.length > 80) {
    return json({ error: "Please enter your name." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return json({ error: "Please enter a valid email." }, 400);
  }
  if (password.length < 8 || password.length > 200) {
    return json({ error: "Password must be at least 8 characters." }, 400);
  }

  const invite = await findFirst(invites().where("email", "==", email));

  if (joining && !invite) {
    return json(
      { error: "No invitation found for this email. Ask your admin to invite you, or create a company account." },
      404
    );
  }

  if (!invite) {
    if (companyName.length < 2 || companyName.length > 100) {
      return json({ error: "Please enter your company name." }, 400);
    }
    if (!(TEAM_SIZES as readonly string[]).includes(teamSize)) {
      return json({ error: "Please select your team size." }, 400);
    }

    if (!INDUSTRIES.some((i) => i.id === industry)) {
      return json({ error: "Please select your company type." }, 400);
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // One atomic batch: the email reservation fails if the email is taken, and then nothing is written.
  const batch = firestore().batch();
  const user = users().doc();
  const reserved = emails().doc(emailKey(email));
  batch.create(reserved, { _id: reserved.id, userId: user.id });

  if (invite) {
    // Invited by a company: join it with the role the admin chose.
    batch.create(user, { _id: user.id, name, email, passwordHash, companyId: invite.companyId, role: invite.role, createdAt: new Date() });
    batch.delete(invites().doc(invite._id));
  } else {
    const company = companies().doc();
    batch.create(company, {
      _id: company.id,
      name: companyName,
      teamSize,
      industry,
      ...(about ? { about } : {}),
      plan: "free",
      lastLearningAt: null,
      createdAt: new Date(),
    });
    batch.create(user, { _id: user.id, name, email, passwordHash, companyId: company.id, role: "owner", createdAt: new Date() });
  }

  try {
    await batch.commit();
    await startSession(user.id);
    return json({ ok: true, joinedTeam: Boolean(invite) }, 201);
  } catch (error) {
    if (isDuplicate(error)) {
      return json({ error: "An account with this email already exists." }, 409);
    }
    throw error;
  }
}
