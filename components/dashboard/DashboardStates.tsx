"use client";

interface SkeletonProps {
  count?: number;
}

export function ProjectCardSkeleton({ count = 3 }: SkeletonProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={`skeleton-${index}`} className="glass-card h-[168px] p-5">
          <div className="skeleton h-4 w-2/3 rounded-full" />
          <div className="skeleton mt-4 h-3 w-full rounded-full" />
          <div className="skeleton mt-2 h-3 w-4/5 rounded-full" />
          <div className="mt-6 flex gap-2">
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="skeleton h-9 w-1/2 rounded-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={`tile-${index}`} className="glass-card h-24 p-5">
            <div className="skeleton h-3 w-20 rounded-full" />
            <div className="skeleton mt-3 h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="glass-card h-[420px] p-6">
          <div className="skeleton h-4 w-32 rounded-full" />
          <div className="skeleton mt-5 h-20 w-full rounded-xl" />
          <div className="skeleton mt-3 h-20 w-full rounded-xl" />
          <div className="skeleton mt-3 h-20 w-full rounded-xl" />
        </div>
        <div className="glass-card h-[420px] p-6">
          <div className="skeleton h-4 w-24 rounded-full" />
          <div className="skeleton mx-auto mt-6 h-52 w-52 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="glass-card p-10 text-center">
      <h2 className="font-display text-lg text-ink">No projects yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-faint">
        Seed a demo project with <span className="font-mono text-ink">npm run seed</span>, or let an
        agent create one by calling <span className="font-mono text-ink">create_project</span>.
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
    <div role="alert" className="glass-card border-rose/30 p-8 text-center">
      <h2 className="font-display text-lg text-rose">Could not reach the ledger</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-faint">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center rounded-full border border-line bg-glass px-4 py-2 text-xs text-ink transition-colors hover:border-cyan/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}