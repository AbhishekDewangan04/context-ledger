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
      <header className="sticky top-0 z-40 border-b border-line bg-base/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-sm font-semibold tracking-tight transition-colors hover:text-cyan"
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet/15 text-violet-soft">
                <NodesIcon className="text-base" />
              </span>
              <span className="font-display">Context Ledger</span>
            </Link>
            <span className="hidden text-faint sm:inline">/</span>
            <h1 className="font-display text-sm text-faint sm:text-base">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {subtitle ? <span className="hidden text-xs text-faint sm:inline">{subtitle}</span> : null}

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-3 py-1.5 text-xs font-medium text-cyan transition-colors hover:bg-cyan/20 hover:border-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
            >
              <TerminalIcon className="text-sm" />
              Connect
            </button>

            {onLock ? (
              <button
                type="button"
                onClick={onLock}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-glass px-3 py-1.5 text-xs text-faint transition-colors hover:border-cyan/60 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
              >
                <LockIcon />
                Use a different key
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <ConnectDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        apiKey={activeKey}
      />
    </>
  );
}