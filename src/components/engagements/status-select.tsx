"use client";

import { useTransition } from "react";
import { updateEngagementStatus } from "@/app/actions/engagements";
import type { EngagementStatus } from "@/types/database";
import { STATUS_LABEL } from "@/lib/utils";

const STATUSES: EngagementStatus[] = [
  "draft",
  "in_progress",
  "in_review",
  "filed",
  "acknowledged",
  "archived",
];

export function StatusSelect({ engagementId, status }: { engagementId: string; status: EngagementStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(e) =>
        startTransition(() => updateEngagementStatus(engagementId, e.target.value as EngagementStatus))
      }
      className="h-9 rounded-sm border border-neutral-200 bg-white px-2 text-sm font-medium disabled:opacity-60"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
