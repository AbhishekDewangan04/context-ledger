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

export class InvalidApiKeyError extends Error {
  constructor(message = "That key was rejected. Check CONTEXT_LEDGER_API_KEY in your environment.") {
    super(message);
    this.name = "InvalidApiKeyError";
  }
}

async function request<T>(path: string, apiKey: string): Promise<T> {
  const response = await fetch(path, {
    headers: { authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (response.status === 401) throw new InvalidApiKeyError();

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `The ledger answered with ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function fetchProjects(apiKey: string): Promise<ProjectSummaryView[]> {
  const body = await request<{ projects?: ProjectSummaryView[] }>("/api/projects", apiKey);
  return Array.isArray(body.projects) ? body.projects : [];
}

export async function fetchProjectDetail(id: string, apiKey: string): Promise<ProjectDetailView> {
  return request<ProjectDetailView>(`/api/projects/${encodeURIComponent(id)}`, apiKey);
}

export async function archiveProjectApi(id: string, apiKey: string): Promise<{ ok: boolean }> {
  const response = await fetch(`/api/projects/${encodeURIComponent(id)}/archive`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (response.status === 401) throw new InvalidApiKeyError();

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `The ledger answered with ${response.status}.`);
  }

  return (await response.json()) as { ok: boolean };
}