"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Field {
  field: string;
  value: string;
  confidence: number;
}

export function ExtractButton({ documentId }: { documentId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[] | null>(null);

  async function handleExtract() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/documents/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Extraction failed.");
      setFields(json.fields);
    } catch (e: any) {
      setError(e?.message ?? "Extraction failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <Button variant="ai" size="sm" onClick={handleExtract} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? "Extracting\u2026" : "Extract with AI"}
      </Button>
      {error && <p className="mt-2 text-sm text-status-danger">{error}</p>}
      {fields && (
        <div className="mt-3 space-y-1.5 rounded-md border border-ai/30 bg-ai/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-ai">
            <Sparkles className="h-3 w-3" /> AI-extracted fields \u2014 review before use
          </p>
          {fields.length === 0 && <p className="text-sm text-neutral-700">No structured fields recognised.</p>}
          {fields.map((f, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-neutral-700">{f.field}</span>
              <span className="flex items-center gap-2 font-medium text-neutral-900">
                {f.value}
                <Badge color={f.confidence >= 0.9 ? "success" : f.confidence >= 0.7 ? "warning" : "danger"}>
                  {Math.round(f.confidence * 100)}%
                </Badge>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
