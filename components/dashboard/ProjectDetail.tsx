"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BudgetPanel from "@/components/dashboard/BudgetPanel";
import EntryTimeline from "@/components/dashboard/EntryTimeline";
import HandoffPanel from "@/components/dashboard/HandoffPanel";
import StatTile from "@/components/dashboard/StatTile";
import { ErrorState, DetailSkeleton } from "@/components/dashboard/DashboardStates";
import { ArchiveIcon } from "@/components/ui/icons";
import { archiveProjectApi } from "@/lib/api";
import { useProjectDetail } from "@/lib/hooks/use-ledger-data";
import { ACTION_LABEL, budgetColor, formatRelative } from "@/lib/presentation";

interface Props {
  projectId: string;
  apiKey: string;
  onInvalidKey: () => void;
}

export default function ProjectDetail({ projectId, apiKey, onInvalidKey }: Props) {
  const router = useRouter();
  const { data, status, error, invalidKey, reload } = useProjectDetail(projectId, apiKey);
  const [showConfirm, setShowConfirm] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  useEffect(() => {
    if (invalidKey) onInvalidKey();
  }, [invalidKey, onInvalidKey]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showConfirm) {
        setShowConfirm(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showConfirm]);

  const handleArchive = async () => {
    setArchiving(true);
    setArchiveError(null);
    try {
      await archiveProjectApi(projectId, apiKey);
      router.push("/dashboard");
    } catch (err) {
      setArchiveError(err instanceof Error ? err.message : "Failed to archive project.");
      setArchiving(false);
    }
  };

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
      <div className="flex items-center justify-between gap-4">
        <BackLink />
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-glass px-3 py-1.5 text-xs text-faint transition-colors hover:border-rose/60 hover:text-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose"
          aria-haspopup="dialog"
        >
          <ArchiveIcon className="text-sm" />
          Archive
        </button>
      </div>

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

      {showConfirm ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-base/80 backdrop-blur-sm transition-opacity"
            onClick={() => !archiving && setShowConfirm(false)}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <div className="glass-card relative z-10 w-full max-w-md p-6 shadow-2xl border border-line">
            <h3 id="archive-modal-title" className="font-display text-lg font-semibold text-ink">
              Archive &ldquo;{data.project.name}&rdquo;?
            </h3>
            <p className="mt-2 text-sm text-faint leading-relaxed">
              This will hide the project from the dashboard and all MCP tool calls (such as list_projects and get_handoff_summary).
            </p>

            {archiveError ? (
              <p className="mt-3 text-xs text-rose">{archiveError}</p>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={archiving}
                onClick={() => setShowConfirm(false)}
                className="rounded-full border border-line bg-glass px-4 py-2 text-xs font-medium text-ink transition-colors hover:border-cyan/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={archiving}
                onClick={handleArchive}
                className="rounded-full bg-rose/90 hover:bg-rose px-4 py-2 text-xs font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose disabled:opacity-50"
              >
                {archiving ? "Archiving..." : "Archive project"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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