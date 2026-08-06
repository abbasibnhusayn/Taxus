"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function PortalHeader({ tenantName, logoUrl }: { tenantName: string; logoUrl?: string | null }) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6">
      <div className="flex items-center gap-2">
        <Image src={logoUrl || "/logo-taxus.png"} alt="Taxus" width={28} height={28} />
        <span className="font-heading text-sm font-semibold text-neutral-900">{tenantName}</span>
      </div>
      <button onClick={handleSignOut} className="flex items-center gap-1.5 text-sm text-neutral-700 hover:text-primary-900">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </header>
  );
}
