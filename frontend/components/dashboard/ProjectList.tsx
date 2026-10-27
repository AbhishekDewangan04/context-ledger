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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="projects-heading" className="font-display text-2xl font-medium tracking-tight text-white">
            Projects
          </h2>
          <p className="mt-1 text-xs text-white/50">
            Active projects tracked by Context Ledger
          </p>
        </div>
        <div className="glass-pill px-3 py-1 text-xs text-white/60 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <span>
            {status === "error" ? "Last good read · retrying 10s" : "Live polling 10s"}
          </span>
        </div>
      </div>

      <ul className="mt-7 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </ul>
    </section>
  );
}