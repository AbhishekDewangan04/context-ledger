"use client";

import Link from "next/link";
import MagneticButton from "@/components/ui/MagneticButton";
import { ArrowRightIcon, NodesIcon } from "@/components/ui/icons";
import { useLiquidGlass } from "@/lib/hooks/use-liquid-glass";
import { handleAnchorClick } from "@/lib/scroll";

const LINKS = [
  { href: "#problem", label: "Why" },
  { href: "#how", label: "How it works" },
  { href: "#tools", label: "Tools" },
  { href: "#connect", label: "Connect" },
];

export default function Nav() {
  const navRef = useLiquidGlass<HTMLElement>();

  return (
    <div className="sticky top-0 z-40 w-full px-4 pt-3 sm:pt-5 pb-2 pointer-events-none">
      <header
        ref={navRef}
        className="glass-nav pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 sm:py-3 overflow-hidden"
      >
        <div className="liquid-glass-sheen" aria-hidden="true" />

        <Link
          href="/"
          className="relative z-10 flex items-center gap-3 text-sm font-semibold tracking-tight group"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-rose via-magenta to-fuchsia text-white shadow-[0_0_18px_rgba(236,72,153,0.55)] transition-transform duration-200 group-hover:scale-105">
            <NodesIcon className="text-base text-white" />
          </span>
          <span className="font-display font-medium text-white tracking-tight text-base sm:text-lg">
            Context Ledger
          </span>
        </Link>

        <nav aria-label="Main" className="relative z-10 hidden items-center gap-8 md:flex">
          <ul className="flex items-center gap-7 text-sm font-normal text-white/70">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  className="transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="relative z-10">
          <MagneticButton
            href="/dashboard"
            variant="primary"
            className="px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-xs"
            ariaLabel="Open the dashboard"
          >
            <span>Dashboard</span>
            <ArrowRightIcon className="text-xs" />
          </MagneticButton>
        </div>
      </header>
    </div>
  );
}