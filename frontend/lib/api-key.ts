const STORAGE_KEY = "context-ledger:api-key";

/** The key lives in sessionStorage: one tab, cleared when the tab closes. */
export function readApiKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY);
    return value && value.trim().length > 0 ? value.trim() : null;
  } catch {
    return null;
  }
}

export function writeApiKey(key: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, key.trim());
  } catch {
    /* private mode — the dashboard still works for this page view */
  }
}

export function clearApiKey(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}