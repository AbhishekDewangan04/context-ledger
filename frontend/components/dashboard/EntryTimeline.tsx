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
      <div className="glass-card p-6 text-center rounded-2xl">
        <p className="text-sm text-white/60">
          Nothing logged yet. Entries appear here as the agent calls{" "}
          <span className="font-mono text-cyan">log_progress</span>,{" "}
          <span className="font-mono text-fuchsia">log_decision</span> and friends.
        </p>
      </div>
    );
  }

  const ordered = [...entries].reverse();

  return (
    <ol className="relative mt-2 space-y-5 border-l border-white/15 pl-6 ml-2">
      {ordered.map((entry, index) => {
        const meta = ENTRY_META[entry.type];

        return (
          <motion.li
            key={entry.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
            className="relative"
          >
            {/* Glowing timeline node */}
            <span
              className={`absolute -left-[31px] top-3.5 h-3 w-3 rounded-full ${meta.dot} ring-4 ring-base shadow-[0_0_10px_currentColor]`}
              aria-hidden="true"
            />
            <div className="glass-card-interactive p-5 rounded-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className={`glass-pill px-2.5 py-0.5 font-medium ${meta.chip} ${meta.text}`}>
                  {meta.label}
                </span>
                <time dateTime={entry.timestamp} className="text-white/50 text-[11px]">
                  {formatDateTime(entry.timestamp)}
                </time>
              </div>

              <p className="mt-2.5 text-sm leading-relaxed text-white/90 font-normal">
                {entry.text}
              </p>

              {entry.reason ? (
                <div className="mt-2.5 rounded-xl bg-white/[0.03] border border-white/5 p-3 text-xs leading-relaxed text-white/70">
                  <span className="font-semibold text-white/80">Reason: </span>
                  {entry.reason}
                </div>
              ) : null}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}