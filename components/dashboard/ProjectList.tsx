"use client";

import { useEffect } from "react";
import ProjectCard from "@/components/dashboard/ProjectCard";
import { EmptyState, ErrorState, ProjectCardSkeleton } from "@/components/dashboard/DashboardStates";
import { useProjects } from "@/lib/hooks/use-ledger-data";

interface Props {
  apiKey: string;
  onInvalidKey: () => void;
}

export default function ProjectList({ apiKey, onInvalidKey }: Props) {
  const { data, status, error, invalidKey, reload } = useProjects(apiKey);

  useEffect(() => {
    if (invalidKey) onInvalidKey();
  }, [invalidKey, onInvalidKey]);

  if (!data && status === "loading") return <ProjectCardSkeleton count={3} />;

  if (!data && status === "error") {
    return <ErrorState message={error ?? "The ledger did not answer."} onRetry={reload} />;
  }

  if (!data || data.length === 0) return <EmptyState />;

  return (
    <section aria-labelledby="projects-heading">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="projects-heading" className="font-display text-xl tracking-tight">
          Projects
        </h2>
        <p className="text-xs text-faint">
          {status === "error" ? "Showing the last good read — retrying every 10s" : "Refreshes every 10s"}
        </p>
      </div>

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </ul>
    </section>
  );
}