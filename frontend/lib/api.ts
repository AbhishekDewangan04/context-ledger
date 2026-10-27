import type {
  BudgetActionName,
  BudgetSnapshotView,
  EntryTypeName,
  LedgerEntryView,
  ProjectDetailView,
  ProjectSummaryView,
} from "@context-ledger/shared";
import { backendPath } from "@/lib/backend-url";

export type {
  BudgetActionName,
  BudgetSnapshotView,
  EntryTypeName,
  LedgerEntryView,
  ProjectDetailView,
  ProjectSummaryView,
} from "@context-ledger/shared";

export class InvalidApiKeyError extends Error {
  constructor(message = "That key was rejected. Check CONTEXT_LEDGER_API_KEY in your environment.") {
    super(message);
    this.name = "InvalidApiKeyError";
  }
}

async function request<T>(path: string, apiKey: string): Promise<T> {
  const response = await fetch(backendPath(path), {
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
  const response = await fetch(backendPath(`/api/projects/${encodeURIComponent(id)}/archive`), {
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
