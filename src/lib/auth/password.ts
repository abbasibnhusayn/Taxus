import bcrypt from "bcryptjs";

// bcryptjs (pure JS, no native bindings) — deliberately chosen over the
// native `bcrypt` package so this compiles reliably in Netlify's serverless
// function bundler without a native build step.
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}
