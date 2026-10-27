"use client";

import { SparkIcon } from "@/components/ui/icons";

interface SkeletonProps {
  count?: number;
}

export function ProjectCardSkeleton({ count = 3 }: SkeletonProps) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={`skeleton-${index}`} className="glass-card h-[180px] p-6 rounded-3xl">
          <div className="skeleton h-5 w-2/3 rounded-full" />
          <div className="skeleton mt-4 h-3 w-full rounded-full" />
          <div className="skeleton mt-2 h-3 w-4/5 rounded-full" />
          <div className="mt-6 flex gap-2">
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-6 w-24 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="skeleton h-10 w-1/2 rounded-full" />
      <div className="grid gap-5 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={`tile-${index}`} className="glass-card h-28 p-6 rounded-2xl">
            <div className="skeleton h-3 w-20 rounded-full" />
            <div className="skeleton mt-3 h-7 w-28 rounded-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="glass-card h-[440px] p-7 rounded-3xl">
          <div className="skeleton h-4 w-32 rounded-full" />
          <div className="skeleton mt-6 h-20 w-full rounded-2xl" />
          <div className="skeleton mt-3 h-20 w-full rounded-2xl" />
          <div className="skeleton mt-3 h-20 w-full rounded-2xl" />
        </div>
        <div className="glass-card h-[440px] p-7 rounded-3xl">
          <div className="skeleton h-4 w-24 rounded-full" />
          <div className="skeleton mx-auto mt-8 h-52 w-52 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="glass-card p-12 text-center rounded-3xl border-white/10">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/5 border border-white/10 text-white/60 mb-4">
        <SparkIcon className="text-xl text-magenta" />
      </div>
      <h2 className="font-display text-xl font-semibold text-white">No projects yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-white/70 leading-relaxed font-normal">
        Seed a demo project with <span className="font-mono text-cyan font-medium">npm run seed</span>, or let an
        agent create one by calling <span className="font-mono text-fuchsia font-medium">create_project</span>.
      </p>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="glass-card border-rose/30 p-10 text-center rounded-3xl">
      <h2 className="font-display text-xl font-semibold text-rose">Could not reach the ledger</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-white/70 leading-relaxed">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 glass-pill px-5 py-2 text-xs font-medium text-white transition-all hover:border-cyan/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
