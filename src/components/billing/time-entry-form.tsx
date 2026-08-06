"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { logTime } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TimeEntryForm({ engagementId }: { engagementId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await logTime(formData);
        formRef.current?.reset();
      } catch (e: any) {
        setError(e?.message ?? "Could not log time.");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="engagement_id" value={engagementId} />
      <div>
        <label className="mb-1 block text-xs text-neutral-700">Minutes</label>
        <Input name="minutes" type="number" min={1} required className="w-24" />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs text-neutral-700">Description</label>
        <Input name="description" placeholder="Reviewed bank statements" />
      </div>
      {error && <p className="w-full text-sm text-status-danger">{error}</p>}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Log time
      </Button>
    </form>
  );
}
