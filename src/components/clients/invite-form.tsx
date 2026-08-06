"use client";

import { useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InvitePortalForm({ clientId }: { clientId: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/clients/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not invite this client.");
      setResult(json);
      setEmail("");
    } catch (e: any) {
      setError(e?.message ?? "Could not invite this client.");
    } finally {
      setLoading(false);
    }
  }

  function copyCredentials() {
    if (!result) return;
    navigator.clipboard.writeText(`Email: ${result.email}\nTemporary password: ${result.tempPassword}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (result) {
    return (
      <div className="space-y-3 rounded-md border border-status-success/40 bg-status-success/5 p-3">
        <p className="text-sm font-medium text-neutral-900">Invitation created</p>
        <p className="text-xs text-neutral-700">
          There is no email delivery configured in this MVP (see README) — share these credentials with
          your client yourself. They should change the password after logging in.
        </p>
        <div className="rounded-sm bg-white p-2 font-mono text-xs">
          <p>Portal URL: {typeof window !== "undefined" ? window.location.origin : ""}/login</p>
          <p>Email: {result.email}</p>
          <p>Temporary password: {result.tempPassword}</p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={copyCredentials}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy credentials"}
        </Button>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="block text-xs text-primary-700 hover:underline"
        >
          Invite another contact
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-neutral-700">
        Invite a contact at this client to the Client Portal, where they can upload documents and track
        filing status.
      </p>
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="contact@client.com"
      />
      {error && <p className="text-sm text-status-danger">{error}</p>}
      <Button type="submit" size="sm" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Inviting\u2026" : "Send invitation"}
      </Button>
    </form>
  );
}
