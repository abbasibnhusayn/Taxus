import { NextResponse } from "next/server";
import { withSystem } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const user = await withSystem(async (sql) => {
    const rows = await sql`select id, email, full_name, password_hash, is_active from users where email = ${normalizedEmail}`;
    return rows[0] ?? null;
  });

  // Deliberately identical error for "no such user" and "wrong password" so
  // the response can't be used to enumerate registered email addresses.
  if (!user || !user.is_active || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  await createSession({ userId: user.id, email: user.email, fullName: user.full_name });
  return NextResponse.json({ ok: true });
}
