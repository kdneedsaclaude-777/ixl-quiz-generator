import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { hashPassword } from "@/lib/password";
import { auditLog } from "@/lib/audit";

// Creates a "family" = a parent User (role=parent). Children are added to it
// afterward from the student list. Core identity fields persist; the richer
// Teachworks fields (extra contacts, address, notification prefs) are accepted
// but only the schema-backed subset is stored for now (later-stage wiring).
//
// No password is collected in the form, and email verification is off for now,
// so we set a random password + mark the account ready. The family can reset
// their password later via the normal flow.
type Body = {
  firstNames?: string;
  lastName?: string;
  email?: string;
  mobilePhone?: string;
  enableUserAccount?: boolean;
};

export async function POST(req: Request): Promise<Response> {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const b = (await req.json().catch(() => ({}))) as Body;
  const first = (b.firstNames ?? "").trim();
  const last = (b.lastName ?? "").trim();
  const email = (b.email ?? "").trim().toLowerCase();
  const name = `${first} ${last}`.trim();

  if (!first || !last) return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "Email already exists." }, { status: 409 });
  }

  const tempPassword = crypto.randomBytes(18).toString("base64url");
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(tempPassword),
      role: "parent",
      orgId: auth.admin.orgId,
      phone: b.mobilePhone?.trim() || null,
      emailVerified: new Date(), // verification is a later-stage step
    },
    select: { id: true, email: true, name: true },
  });
  await prisma.notificationSettings
    .create({ data: { userId: user.id } })
    .catch((e) => console.error("[families] notificationSettings create failed", e));

  await auditLog({
    actorId: auth.admin.userId,
    action: "create_user",
    targetType: "User",
    targetId: user.id,
    metadata: { role: "parent", via: "new_family_form", email: user.email },
  });

  return NextResponse.json({ ok: true, parentId: user.id });
}
