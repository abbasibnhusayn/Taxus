import { SignJWT, jwtVerify } from "jose";

// jose is pure-JS and works in both the Node.js function runtime and the
// Edge runtime (used by middleware.ts), unlike libraries that depend on
// Node's `crypto` module directly.
const SESSION_COOKIE_NAME = "taxus_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is not set (or is too short). Generate one with `openssl rand -base64 32` and set it as an environment variable — see DEPLOYMENT.md."
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.userId !== "string" || typeof payload.email !== "string") return null;
    return { userId: payload.userId, email: payload.email, fullName: (payload.fullName as string) ?? "" };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS };
