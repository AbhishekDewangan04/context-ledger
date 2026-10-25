import type { BudgetActionName, EntryTypeName } from "@/lib/api";

export interface EntryMeta {
  label: string;
  hex: string;
  dot: string;
  text: string;
  chip: string;
}

/** One place for entry colours and labels — reused by the timeline and cards. */
export const ENTRY_META: Record<EntryTypeName, EntryMeta> = {
  progress: {
    label: "Progress",
    hex: "#22D3EE",
    dot: "bg-cyan",
    text: "text-cyan",
    chip: "bg-cyan/10",
  },
  decision: {
    label: "Decision",
    hex: "#7C3AED",
    dot: "bg-violet",
    text: "text-violet-soft",
    chip: "bg-violet/10",
  },
  issue: {
    label: "Issue",
    hex: "#F43F5E",
    dot: "bg-rose",
    text: "text-rose",
    chip: "bg-rose/10",
  },
  next: {
    label: "Next",
    hex: "#F59E0B",
    dot: "bg-amber",
    text: "text-amber",
    chip: "bg-amber/10",
  },
};

export interface BudgetTone {
  hex: string;
  label: string;
  text: string;
}

/** Same thresholds the MCP tool reports: 80 warns, 90 stops. */
export function budgetColor(percent: number): BudgetTone {
  if (percent >= 90) return { hex: "#F43F5E", label: "Stop and summarise", text: "text-rose" };
  if (percent >= 80) return { hex: "#F59E0B", label: "Wrap up", text: "text-amber" };
  return { hex: "#22D3EE", label: "Healthy", text: "text-cyan" };
}

export const ACTION_LABEL: Record<BudgetActionName, string> = {
  continue: "continue",
  warn: "warn",
  stop_and_summarize: "stop_and_summarize",
};

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function formatRelative(value: string): string {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return value;

  const minutes = Math.round((Date.now() - time) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDateTime(value);
}