import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
        <Icon className="h-6 w-6 text-primary-700" />
      </div>
      <div>
        <p className="font-heading font-semibold text-neutral-900">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-neutral-700">{description}</p>}
      </div>
      {action}
    </div>
  );
}
