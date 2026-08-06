"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export function Header({ userName, unreadCount }: { userName: string; unreadCount: number }) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input placeholder="Search clients, engagements\u2026" className="pl-9" />
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative rounded-full p-2 text-neutral-700 hover:bg-neutral-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-status-danger" />
          )}
        </button>
        <div className="flex items-center gap-2">
          <Avatar name={userName} size={32} />
          <span className="hidden text-sm font-medium text-neutral-900 sm:inline">{userName}</span>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-md p-2 text-neutral-700 hover:bg-neutral-100"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
