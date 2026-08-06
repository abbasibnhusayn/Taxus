"use client";

import { useRef, useState, useTransition } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { uploadDocument } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";

export function DocumentUploadForm({
  engagementId,
  clientId,
  categories,
  action,
}: {
  engagementId?: string;
  clientId?: string;
  categories: { id: string; name: string }[];
  action?: (formData: FormData) => Promise<void | string>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await (action ?? uploadDocument)(formData);
        formRef.current?.reset();
      } catch (e: any) {
        setError(e?.message ?? "Upload failed.");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3 rounded-md border border-dashed border-neutral-400 p-4">
      {engagementId && <input type="hidden" name="engagement_id" value={engagementId} />}
      {clientId && <input type="hidden" name="client_id" value={clientId} />}
      <div className="flex items-center gap-3">
        <UploadCloud className="h-5 w-5 text-neutral-400" />
        <input
          type="file"
          name="file"
          required
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary-100 file:px-3 file:py-1.5 file:text-primary-900"
        />
      </div>
      <select name="category_id" className="h-9 w-full rounded-sm border border-neutral-200 px-2 text-sm" defaultValue="">
        <option value="">Uncategorized</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-status-danger">{error}</p>}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
        {isPending ? "Uploading\u2026" : "Upload document"}
      </Button>
    </form>
  );
}
