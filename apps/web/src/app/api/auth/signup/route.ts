import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { companies, invites, users } from "@/lib/db";
import { startSession } from "@/lib/auth";
import { json, readBody } from "@/lib/http";
import { TEAM_SIZES } from "@/constants/team";

export async function POST(request: Request) {
  const body = await readBody(request);
  const companyName = String(body.companyName ?? "").trim().replace(/\s+/g, " ");
  const teamSize = String(body.teamSize ?? "");
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

  const usersCol = await users();
  const invite = await (await invites()).findOne({ email });

  if (joining && !invite) {
    return json(
      { error: "No invitation found for this email. Ask your admin to invite you, or create a company account." },
      404
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    let userId: ObjectId;

    if (invite) {
      // Invited by a company: join it with the role the admin chose.
      const created = await usersCol.insertOne({
        name,
        email,
        passwordHash,
        companyId: invite.companyId,
        role: invite.role,
        createdAt: new Date(),
      });
      userId = created.insertedId;
      await (await invites()).deleteOne({ _id: invite._id });
    } else {
      if (companyName.length < 2 || companyName.length > 100) {
        return json({ error: "Please enter your company name." }, 400);
      }
      if (!(TEAM_SIZES as readonly string[]).includes(teamSize)) {
        return json({ error: "Please select your team size." }, 400);
      }

      const company = await (await companies()).insertOne({
        name: companyName,
        teamSize,
        plan: "free",
        createdAt: new Date(),
      });

      try {
        const created = await usersCol.insertOne({
          name,
          email,
          passwordHash,
          companyId: company.insertedId,
          role: "owner",
          createdAt: new Date(),
        });
        userId = created.insertedId;
      } catch (error) {
        await (await companies()).deleteOne({ _id: company.insertedId });
        throw error;
      }
    }

    await startSession(userId.toString());
    return json({ ok: true, joinedTeam: Boolean(invite) }, 201);
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return json({ error: "An account with this email already exists." }, 409);
    }
    throw error;
  }
}
