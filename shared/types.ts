export type EntryTypeName = "decision" | "progress" | "issue" | "next";
export type BudgetActionName = "continue" | "warn" | "stop_and_summarize";

export interface BudgetSnapshotView {
  tokens_used: number;
  token_limit: number;
  percent: number;
  action: BudgetActionName;
  timestamp: string;
}

export interface LedgerEntryView {
  id: string;
  type: EntryTypeName;
  text: string;
  reason?: string;
  timestamp: string;
}

export interface ProjectSummaryView {
  id: string;
  name: string;
  goal: string;
  created_at: string;
  updated_at: string;
  entry_count: number;
  latest_budget: BudgetSnapshotView | null;
}

export interface ProjectDetailView {
  project: {
    id: string;
    name: string;
    goal: string;
    created_at: string;
    updated_at: string;
  };
  entries: LedgerEntryView[];
  latest_budget: BudgetSnapshotView | null;
  summary: string;
}
