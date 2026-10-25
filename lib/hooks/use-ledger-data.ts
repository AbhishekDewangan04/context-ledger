"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchProjectDetail,
  fetchProjects,
  InvalidApiKeyError,
  type ProjectDetailView,
  type ProjectSummaryView,
} from "@/lib/api";

type LoadStatus = "loading" | "success" | "error";

interface LedgerData<T> {
  data: T | null;
  status: LoadStatus;
  error: string | null;
  invalidKey: boolean;
  reload: () => void;
}

function usePollingData<T>(loadData: () => Promise<T>): LedgerData<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [invalidKey, setInvalidKey] = useState(false);
  const reloadRef = useRef<() => void>(() => {});

  const reload = useCallback(() => reloadRef.current(), []);

  useEffect(() => {
    let active = true;
    let inFlight = false;

    setData(null);
    setStatus("loading");
    setError(null);
    setInvalidKey(false);

    const run = async () => {
      if (inFlight) return;
      inFlight = true;

      try {
        const result = await loadData();
        if (!active) return;

        setData(result);
        setStatus("success");
        setError(null);
        setInvalidKey(false);
      } catch (caught) {
        if (!active) return;

        setStatus("error");
        setError(caught instanceof Error ? caught.message : "The ledger did not answer.");
        setInvalidKey(caught instanceof InvalidApiKeyError);
      } finally {
        inFlight = false;
      }
    };

    reloadRef.current = () => {
      void run();
    };
    void run();

    const interval = window.setInterval(() => {
      void run();
    }, 10_000);

    return () => {
      active = false;
      window.clearInterval(interval);
      reloadRef.current = () => {};
    };
  }, [loadData]);

  return { data, status, error, invalidKey, reload };
}

export function useProjects(apiKey: string): LedgerData<ProjectSummaryView[]> {
  const loadData = useCallback(() => fetchProjects(apiKey), [apiKey]);
  return usePollingData(loadData);
}

export function useProjectDetail(
  projectId: string,
  apiKey: string,
): LedgerData<ProjectDetailView> {
  const loadData = useCallback(
    () => fetchProjectDetail(projectId, apiKey),
    [projectId, apiKey],
  );
  return usePollingData(loadData);
}
