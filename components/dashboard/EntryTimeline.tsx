"use client";

import { motion } from "framer-motion";
import type { LedgerEntryView } from "@/lib/api";
import { ENTRY_META, formatDateTime } from "@/lib/presentation";

interface Props {
  entries: LedgerEntryView[];
}

export default function EntryTimeline({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-glass p-4 text-sm text-faint">
        Nothing logged yet. Entries appear here as the agent calls log_progress, log_decision and
        friends.
      </p>
    );
  }

  const ordered = [...entries].reverse();

  return (
    <ol className="relative mt-2 space-y-4 border-l border-line pl-6">
      {ordered.map((entry, index) => {
        const meta = ENTRY_META[entry.type];

        return (
          <motion.li
            key={entry.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
            className="relative"
          >
            <span
              className={`absolute -left-[31px] top-2.5 h-2.5 w-2.5 rounded-full ${meta.dot} ring-4 ring-base`}
              aria-hidden="true"
            />
            <div className="glass-card p-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className={`rounded-full px-2 py-0.5 font-medium ${meta.chip} ${meta.text}`}>
                  {meta.label}
                </span>
                <time dateTime={entry.timestamp} className="text-faint">
                  {formatDateTime(entry.timestamp)}
                </time>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink">{entry.text}</p>
              {entry.reason ? (
                <p className="mt-1.5 text-sm leading-relaxed text-faint">Because: {entry.reason}</p>
              ) : null}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}