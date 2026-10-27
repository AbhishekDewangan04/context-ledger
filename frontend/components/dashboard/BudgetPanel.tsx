"use client";

import dynamic from "next/dynamic";
import type { BudgetSnapshotView } from "@/lib/api";
import { ACTION_LABEL, budgetColor, formatDateTime, formatNumber } from "@/lib/presentation";

const BudgetGauge = dynamic(() => import("@/components/three/BudgetGauge"), { ssr: false });

interface Props {
  budget: BudgetSnapshotView | null;
}

export default function BudgetPanel({ budget }: Props) {
  const percent = budget?.percent ?? 0;
  const tone = budgetColor(percent);

  return (
    <section className="glass-card p-6 sm:p-7 rounded-3xl flex flex-col justify-between" aria-labelledby="budget-heading">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h2 id="budget-heading" className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Token budget
          </h2>
          {budget ? (
            <span className="glass-pill px-2.5 py-0.5 font-mono text-[11px] text-white/70">
              {budget.percent}%
            </span>
          ) : null}
        </div>

        <div className="relative mx-auto mt-6 h-[210px] w-full max-w-[230px]">
          <BudgetGauge percent={percent} className="h-full w-full" />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className={`font-display text-4xl font-semibold tracking-tight ${tone.text} drop-shadow-[0_0_12px_currentColor]`}>
                {budget ? `${percent}%` : "—"}
              </p>
              <p className="mt-1 text-xs text-white/60 font-medium">
                {budget ? tone.label : "not checked"}
              </p>
            </div>
          </div>
        </div>

        <dl className="mt-6 space-y-2.5 text-sm">
          <div className="flex items-baseline justify-between gap-3 p-2 rounded-xl bg-white/[0.02]">
            <dt className="text-white/60 text-xs">Tokens used</dt>
            <dd className="font-mono text-xs text-white/90 font-medium">
              {budget ? `${formatNumber(budget.tokens_used)} / ${formatNumber(budget.token_limit)}` : "—"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 p-2 rounded-xl bg-white/[0.02]">
            <dt className="text-white/60 text-xs">Action status</dt>
            <dd className={`font-mono text-xs font-semibold ${tone.text}`}>
              {budget ? ACTION_LABEL[budget.action] : "—"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 p-2 rounded-xl bg-white/[0.02]">
            <dt className="text-white/60 text-xs">Last checked</dt>
            <dd className="text-xs text-white/60">
              {budget ? formatDateTime(budget.timestamp) : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-5 border-t border-white/10 pt-3.5 text-[11px] leading-relaxed text-white/50">
        Under 80% the agent continues, 80–89% triggers a warning, 90%+ commands stop and summarise.
      </p>
    </section>
  );
}