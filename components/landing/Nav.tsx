"use client";

import Link from "next/link";
import MagneticButton from "@/components/ui/MagneticButton";
import { ArrowRightIcon, NodesIcon } from "@/components/ui/icons";
import { handleAnchorClick } from "@/lib/scroll";

const LINKS = [
  { href: "#problem", label: "Why" },
  { href: "#how", label: "How it works" },
  { href: "#tools", label: "Tools" },
  { href: "#connect", label: "Connect" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-base/70 backdrop-blur-xl">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8"
      >
        <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-tight">
          <span className="glow-violet grid h-7 w-7 place-items-center rounded-lg bg-violet/15 text-violet-soft">
            <NodesIcon className="text-base" />
          </span>
          <span className="font-display">Context Ledger</span>
        </Link>

        <ul className="hidden items-center gap-7 text-sm text-faint md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <MagneticButton
          href="/dashboard"
          variant="ghost"
          className="px-4 py-2 text-xs"
          ariaLabel="Open the dashboard"
        >
          Dashboard
          <ArrowRightIcon />
        </MagneticButton>
      </nav>
    </header>
  );
}