import Link from "next/link";
import { NodesIcon } from "@/components/ui/icons";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5 text-sm">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet/15 text-violet-soft">
            <NodesIcon className="text-base" />
          </span>
          <span className="font-display font-semibold">Context Ledger</span>
          <span className="text-faint">· MCP memory server</span>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-6 text-sm text-faint">
            <li>
              <Link href="/dashboard" className="transition-colors hover:text-ink">
                Dashboard
              </Link>
            </li>
            <li>
              <a href="#tools" className="transition-colors hover:text-ink">
                Tools
              </a>
            </li>
            <li>
              <a href="#connect" className="transition-colors hover:text-ink">
                Connect
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}