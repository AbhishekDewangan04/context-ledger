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
    <section className="glass-card p-6" aria-labelledby="budget-heading">
      <h2 id="budget-heading" className="text-[10px] uppercase tracking-wider text-faint">
        Token budget
      </h2>

      <div className="relative mx-auto mt-4 h-[210px] w-full max-w-[230px]">
        <BudgetGauge percent={percent} className="h-full w-full" />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className={`font-display text-3xl tracking-tight ${tone.text}`}>
              {budget ? `${percent}%` : "—"}
            </p>
            <p className="mt-0.5 text-[11px] text-faint">{budget ? tone.label : "not checked"}</p>
          </div>
        </div>
      </div>

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-faint">Tokens used</dt>
          <dd className="font-mono text-xs text-ink">
            {budget ? `${formatNumber(budget.tokens_used)} / ${formatNumber(budget.token_limit)}` : "—"}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-faint">Action</dt>
          <dd className={`font-mono text-xs ${tone.text}`}>
            {budget ? ACTION_LABEL[budget.action] : "—"}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-faint">Checked</dt>
          <dd className="text-xs text-faint">
            {budget ? formatDateTime(budget.timestamp) : "—"}
          </dd>
        </div>
      </dl>

      <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
        Under 80% the agent keeps working, 80–89% warns, 90% and up tells it to stop and hand off.
      </p>
    </section>
  );
}