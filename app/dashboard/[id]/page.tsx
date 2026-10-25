"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ApiKeyGate from "@/components/dashboard/ApiKeyGate";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ProjectDetail from "@/components/dashboard/ProjectDetail";
import { DetailSkeleton } from "@/components/dashboard/DashboardStates";
import { clearApiKey, readApiKey } from "@/lib/api-key";

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = typeof params?.id === "string" ? params.id : "";
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setApiKey(readApiKey());
    setHydrated(true);
  }, []);

  const lock = useCallback(() => {
    clearApiKey();
    setApiKey(null);
  }, []);

  if (!hydrated) {
    return (
      <>
        <DashboardHeader title="Project" />
        <main id="main" className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <DetailSkeleton />
        </main>
      </>
    );
  }

  if (!apiKey) return <ApiKeyGate onUnlock={setApiKey} />;

  return (
    <>
      <DashboardHeader title="Project" subtitle="Polling every 10 seconds" onLock={lock} />
      <main id="main" className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {projectId ? (
          <ProjectDetail projectId={projectId} apiKey={apiKey} onInvalidKey={lock} />
        ) : (
          <p className="text-sm text-faint">No project id in the URL.</p>
        )}
      </main>
    </>
  );
}