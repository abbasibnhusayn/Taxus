import { cookies } from "next/headers";
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS, type SessionPayload } from "./jwt";

// Server Component / Server Action / Route Handler helpers for reading and
// writing the session cookie. (middleware.ts has its own thin copy of the
// verify step because it runs on the Edge runtime and reads from the
// request/response directly rather than next/headers.)

export async function createSession(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function destroySession() {
  cookies().delete(SESSION_COOKIE_NAME);
}
