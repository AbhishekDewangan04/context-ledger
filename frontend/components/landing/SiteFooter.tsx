"use client";

import Link from "next/link";
import { NodesIcon } from "@/components/ui/icons";
import { handleAnchorClick } from "@/lib/scroll";

export default function SiteFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-base/50 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-sm">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-rose via-magenta to-fuchsia text-white shadow-[0_0_14px_rgba(236,72,153,0.45)]">
            <NodesIcon className="text-base text-white" />
          </span>
          <span className="font-display font-medium text-white text-base">Context Ledger</span>
          <span className="text-white/50 text-xs">· MCP memory server</span>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-8 text-sm font-normal text-white/70">
            <li>
              <Link href="/dashboard" className="transition-colors duration-200 hover:text-white">
                Dashboard
              </Link>
            </li>
            <li>
              <a
                href="#tools"
                onClick={(e) => handleAnchorClick(e, "#tools")}
                className="transition-colors duration-200 hover:text-white"
              >
                Tools
              </a>
            </li>
            <li>
              <a
                href="#connect"
                onClick={(e) => handleAnchorClick(e, "#connect")}
                className="transition-colors duration-200 hover:text-white"
              >
                Connect
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}