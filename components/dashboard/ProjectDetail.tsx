"use client";

import Link from "next/link";
import { useEffect } from "react";
import BudgetPanel from "@/components/dashboard/BudgetPanel";
import EntryTimeline from "@/components/dashboard/EntryTimeline";
import HandoffPanel from "@/components/dashboard/HandoffPanel";
import StatTile from "@/components/dashboard/StatTile";
import { ErrorState, DetailSkeleton } from "@/components/dashboard/DashboardStates";
import { useProjectDetail } from "@/lib/hooks/use-ledger-data";
import { ACTION_LABEL, budgetColor, formatRelative } from "@/lib/presentation";

interface Props {
  projectId: string;
  apiKey: string;
  onInvalidKey: () => void;
}

export default function ProjectDetail({ projectId, apiKey, onInvalidKey }: Props) {
  const { data, status, error, invalidKey, reload } = useProjectDetail(projectId, apiKey);

  useEffect(() => {
    if (invalidKey) onInvalidKey();
  }, [invalidKey, onInvalidKey]);

  if (!data && status === "loading") return <DetailSkeleton />;

  if (!data && status === "error") {
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState message={error ?? "The ledger did not answer."} onRetry={reload} />
      </div>
    );
  }

  if (!data) return null;

  const budget = data.latest_budget;
  const tone = budgetColor(budget?.percent ?? 0);

  return (
    <div className="space-y-8">
      <BackLink />

      <header>
        <h2 className="font-display text-2xl tracking-tight sm:text-3xl">{data.project.name}</h2>
        <p className="mt-2 max-w-2xl text-sm text-faint">{data.project.goal}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Entries" value={String(data.entries.length)} hint="decisions, progress, issues, next" />
        <StatTile
          label="Budget"
          value={budget ? `${budget.percent}%` : "—"}
          hint={budget ? ACTION_LABEL[budget.action] : "not checked yet"}
          tone={tone.text}
        />
        <StatTile
          label="Last update"
          value={formatRelative(data.project.updated_at)}
          hint={status === "error" ? "retrying every 10s" : "polling every 10s"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="glass-card p-6" aria-labelledby="timeline-heading">
          <h2 id="timeline-heading" className="text-[10px] uppercase tracking-wider text-faint">
            Timeline
          </h2>
          <EntryTimeline entries={data.entries} />
        </section>

        <BudgetPanel budget={budget} />
      </div>

      <HandoffPanel summary={data.summary} projectName={data.project.name} />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-2 text-xs text-faint transition-colors hover:text-cyan"
    >
      ← All projects
    </Link>
  );
}