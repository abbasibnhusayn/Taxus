import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  success: "bg-status-success/10 text-status-success",
  warning: "bg-status-warning/10 text-status-warning",
  danger: "bg-status-danger/10 text-status-danger",
  info: "bg-status-info/10 text-status-info",
  neutral: "bg-status-neutral/10 text-status-neutral",
  ai: "bg-ai/10 text-ai",
};

export function Badge({ color = "neutral", children }: { color?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        colorMap[color] ?? colorMap.neutral
      )}
    >
      {children}
    </span>
  );
}
