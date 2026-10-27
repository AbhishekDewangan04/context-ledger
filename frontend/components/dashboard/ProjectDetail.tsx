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
    <div className="space-y-8 pb-16">
      <div className="flex items-center justify-between gap-4">
        <BackLink />
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="glass-pill px-3.5 py-1.5 text-xs text-white/70 transition-all hover:border-rose/50 hover:text-rose hover:shadow-[0_0_14px_rgba(244,63,94,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose gap-1.5"
          aria-haspopup="dialog"
        >
          <ArchiveIcon className="text-sm" />
          <span>Archive project</span>
        </button>
      </div>

      <header>
        <h2 className="font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
          {data.project.name}
        </h2>
        <p className="mt-3 max-w-2xl text-base text-white/70 leading-relaxed">
          {data.project.goal}
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          label="Entries"
          value={String(data.entries.length)}
          hint="decisions, progress, issues, next"
        />
        <StatTile
          label="Budget"
          value={budget ? `${budget.percent}%` : "—"}
          hint={budget ? ACTION_LABEL[budget.action] : "not checked yet"}
          tone={tone.text}
        />
        <StatTile
          label="Last update"
          value={formatRelative(data.project.updated_at)}
          hint="latest activity recorded"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <section className="glass-card p-6 sm:p-8 rounded-3xl" aria-labelledby="timeline-heading">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <h2 id="timeline-heading" className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Activity Timeline
            </h2>
            <span className="glass-pill px-2.5 py-0.5 text-[11px] text-white/60">
              {data.entries.length} {data.entries.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <div className="mt-6">
            <EntryTimeline entries={data.entries} />
          </div>
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
          {/* Backdrop with frosted blur */}
          <div
            className="fixed inset-0 bg-base/80 backdrop-blur-md transition-opacity"
            onClick={() => !archiving && setShowConfirm(false)}
            aria-hidden="true"
          />

          {/* Modal Card with Apple Liquid Glass styling */}
          <div className="glass-modal relative z-10 w-full max-w-md p-7 shadow-2xl rounded-3xl border border-white/20">
            <div className="liquid-glass-sheen" aria-hidden="true" />
            <div className="relative z-10">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose/15 text-rose border border-rose/30 shadow-[0_0_15px_rgba(244,63,94,0.4)] mb-4">
                <ArchiveIcon className="text-lg" />
              </span>

              <h3 id="archive-modal-title" className="font-display text-xl font-semibold text-white">
                Archive &ldquo;{data.project.name}&rdquo;?
              </h3>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">
                This will hide the project from the dashboard and all MCP tool calls (such as list_projects and get_handoff_summary).
              </p>

              {archiveError ? (
                <p className="mt-3 text-xs text-rose bg-rose/10 border border-rose/30 rounded-xl p-2.5">
                  {archiveError}
                </p>
              ) : null}

              <div className="mt-7 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={archiving}
                  onClick={() => setShowConfirm(false)}
                  className="glass-pill px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:text-white hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={archiving}
                  onClick={handleArchive}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose to-pink-600 px-5 py-2 text-xs font-medium text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose disabled:opacity-50"
                >
                  {archiving ? "Archiving..." : "Archive project"}
                </button>
              </div>
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
      className="glass-pill px-3.5 py-1.5 text-xs text-white/70 transition-all hover:text-cyan hover:border-cyan/40"
    >
      ← All projects
    </Link>
  );
}