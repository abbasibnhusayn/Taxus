"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Could not log in.");
      return;
    }
    router.push("/app/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-8 shadow-elevation2">
        <div className="mb-6 flex flex-col items-center">
          <Image src="/logo-taxus.png" alt="Taxus" width={44} height={44} />
          <h1 className="mt-3 font-heading text-xl font-semibold text-neutral-900">Log in to Taxus</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@firm.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-sm bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in\u2026" : "Log in"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-neutral-700">
          New firm?{" "}
          <Link href="/signup" className="font-medium text-primary-700 hover:underline">
            Create a workspace
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-neutral-400">A HALOOL (Private) Limited product</p>
      </div>
    </div>
  );
}
