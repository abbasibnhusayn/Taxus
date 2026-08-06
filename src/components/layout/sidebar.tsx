"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Sparkles,
  Receipt,
  Bell,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [{ href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Practice",
    items: [
      { href: "/app/clients", label: "Clients", icon: Users },
      { href: "/app/engagements", label: "Engagements", icon: Briefcase },
      { href: "/app/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    label: "Intelligence",
    items: [{ href: "/app/assistant", label: "Tax Assistant", icon: Sparkles }],
  },
  {
    label: "Operations",
    items: [
      { href: "/app/billing", label: "Billing", icon: Receipt },
      { href: "/app/notifications", label: "Notifications", icon: Bell },
      { href: "/app/audit", label: "Audit Trail", icon: ShieldCheck },
    ],
  },
  {
    label: "Administration",
    items: [{ href: "/app/settings", label: "Settings", icon: Settings }],
  },
];

export function Sidebar({ tenantName, logoUrl }: { tenantName: string; logoUrl?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-5">
        <Image src={logoUrl || "/logo-taxus.png"} alt="Taxus" width={28} height={28} className="rounded-sm" />
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-semibold text-neutral-900">{tenantName}</p>
          <p className="text-xs text-neutral-400">Taxus</p>
        </div>
      </div>
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium",
                    active ? "bg-primary-100 text-primary-900" : "text-neutral-700 hover:bg-neutral-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-neutral-200 p-3">
        <div className="flex items-center justify-center gap-1.5 rounded-md bg-neutral-100 px-3 py-2 text-xs text-neutral-700">
          <span>A</span>
          <Image src="/logo-halool.png" alt="HALOOL" width={16} height={16} />
          <span className="font-medium">HALOOL</span>
          <span>product</span>
        </div>
      </div>
    </aside>
  );
}
