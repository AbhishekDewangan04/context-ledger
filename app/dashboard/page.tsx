"use client";

import { useCallback, useEffect, useState } from "react";
import ApiKeyGate from "@/components/dashboard/ApiKeyGate";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ProjectList from "@/components/dashboard/ProjectList";
import { ProjectCardSkeleton } from "@/components/dashboard/DashboardStates";
import { clearApiKey, readApiKey } from "@/lib/api-key";

export default function DashboardPage() {
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
        <DashboardHeader title="Projects" />
        <main id="main" className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <ProjectCardSkeleton count={3} />
        </main>
      </>
    );
  }

  if (!apiKey) return <ApiKeyGate onUnlock={setApiKey} />;

  return (
    <>
      <DashboardHeader title="Projects" subtitle="Polling every 10 seconds" apiKey={apiKey} onLock={lock} />
      <main id="main" className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <ProjectList apiKey={apiKey} onInvalidKey={lock} />
      </main>
    </>
  );
}