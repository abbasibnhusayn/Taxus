import { NextResponse } from "next/server";
import { withSystem } from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

// POST /api/auth/signup — creates a user AND provisions a new tenant
// (firm workspace) for them in one call, via the provision_tenant() SQL
// function (netlify/database/migrations/0002.../migration.sql).
export async function POST(req: Request) {
  const { firmName, fullName, email, password } = await req.json();

  if (!firmName || !fullName || !email || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  const passwordError = validatePasswordStrength(password);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const result = await withSystem(async (sql) => {
      const existing = await sql`select id from users where email = ${normalizedEmail}`;
      if (existing.length) throw new Error("An account with this email already exists.");

      const passwordHash = await hashPassword(password);
      const [user] = await sql`
        insert into users (email, password_hash, full_name)
        values (${normalizedEmail}, ${passwordHash}, ${fullName})
        returning id, email, full_name
      `;

      const subdomain = `${slugify(firmName)}-${user.id.slice(0, 6)}`;
      await sql`select provision_tenant(${firmName}, ${subdomain}, ${user.id}::uuid)`;

      return user;
    });

    await createSession({ userId: result.id, email: result.email, fullName: result.full_name });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Signup failed." }, { status: 400 });
  }
}
