"use client";

import Link from "next/link";
import { useState } from "react";
import ConnectDrawer from "@/components/dashboard/ConnectDrawer";
import { LockIcon, NodesIcon, TerminalIcon } from "@/components/ui/icons";
import { readApiKey } from "@/lib/api-key";

interface Props {
  title: string;
  subtitle?: string;
  apiKey?: string | null;
  onLock?: () => void;
}

export default function DashboardHeader({ title, subtitle, apiKey, onLock }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeKey = apiKey ?? readApiKey();

  return (
    <>
      <div className="sticky top-0 z-40 w-full px-4 pt-3 pb-2 pointer-events-none sm:pt-4">
        <header className="glass-nav pointer-events-auto mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 overflow-hidden px-4 py-2.5 sm:px-6 sm:py-3">
          <div className="liquid-glass-sheen" aria-hidden="true" />
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="glass-pill px-3 py-1 text-xs text-white/70 transition-colors hover:text-cyan hover:border-cyan/40"
            >
              ← Back to site
            </Link>
            <span className="text-white/20">/</span>
            <Link
              href="/"
              className="flex items-center gap-2.5 text-sm font-semibold tracking-tight transition-transform duration-200 hover:scale-102"
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-rose via-magenta to-fuchsia text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]">
                <NodesIcon className="text-sm text-white" />
              </span>
              <span className="font-display font-medium text-white text-sm sm:text-base">Context Ledger</span>
            </Link>
            <span className="hidden text-white/20 sm:inline">/</span>
            <h1 className="font-display text-sm font-normal text-white/70 sm:text-base">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {subtitle ? (
              <span className="hidden text-xs text-white/50 sm:inline flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse shadow-[0_0_8px_#22d3ee]" />
                {subtitle}
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Connect client"
              className="glass-pill px-3.5 py-1.5 text-xs font-medium text-cyan border-cyan/30 bg-cyan/10 transition-all duration-200 hover:bg-cyan/20 hover:border-cyan/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan gap-1.5"
            >
              <TerminalIcon className="text-sm text-cyan drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
              <span>Connect client</span>
            </button>

            {onLock ? (
              <button
                type="button"
                onClick={onLock}
                className="glass-pill px-3 py-1.5 text-xs text-white/70 transition-all duration-200 hover:text-white hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan gap-1.5"
              >
                <LockIcon className="text-xs text-white/60" />
                <span className="hidden sm:inline">Use different key</span>
                <span className="sm:hidden">Lock</span>
              </button>
            ) : null}
          </div>
        </header>
      </div>

      <ConnectDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        apiKey={activeKey}
      />
    </>
  );
}
