"use server";

import { revalidatePath } from "next/cache";
import { requireStaffContext } from "@/lib/tenant";

function relativeLuminance(hex: string) {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function meetsMinimumContrast(hexA: string, hexB: string, minRatio: number) {
  const lA = relativeLuminance(hexA.replace("#", ""));
  const lB = relativeLuminance(hexB.replace("#", ""));
  const ratio = (Math.max(lA, lB) + 0.05) / (Math.min(lA, lB) + 0.05);
  return ratio >= minRatio;
}

export async function updateTenantBranding(formData: FormData) {
  const { run, tenantId, user } = await requireStaffContext();

  const name = String(formData.get("name") || "").trim();
  const accent_color = String(formData.get("accent_color") || "").trim();

  // Server-side contrast guard, per SRS Volume 3 Settings business rules and
  // Volume 2 Ch.4.4 — a tenant accent colour may never be saved if it would
  // fail WCAG AA contrast against white card backgrounds.
  if (!/^#([0-9A-Fa-f]{6})$/.test(accent_color)) {
    throw new Error("Accent colour must be a valid 6-digit hex value, e.g. #2F5496.");
  }
  if (!meetsMinimumContrast(accent_color, "#FFFFFF", 4.5)) {
    throw new Error("That accent colour doesn't meet the minimum 4.5:1 contrast ratio against white. Choose a darker shade.");
  }

  await run((tx) => tx`update tenants set name = ${name}, accent_color = ${accent_color} where id = ${tenantId}`);

  await run(
    (tx) =>
      tx`select write_audit_log(${tenantId}, ${user.id}, 'settings.branding_updated', 'tenant', ${tenantId}, null, ${JSON.stringify({ name, accent_color })}::jsonb)`
  );

  revalidatePath("/app/settings");
}
