import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "PKR") {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date | null) {
  if (!date) return "\u2014";
  return new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(new Date(date));
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  in_review: "In Review",
  filed: "Filed",
  acknowledged: "Acknowledged",
  archived: "Archived",
};

export const STATUS_COLOR: Record<string, string> = {
  draft: "neutral",
  in_progress: "info",
  in_review: "warning",
  filed: "success",
  acknowledged: "success",
  archived: "neutral",
};
