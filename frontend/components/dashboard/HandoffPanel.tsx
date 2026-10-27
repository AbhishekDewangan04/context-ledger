"use client";

import Markdown, { type Components } from "react-markdown";
import CopyButton from "@/components/ui/CopyButton";
import { DownloadIcon } from "@/components/ui/icons";

interface Props {
  summary: string;
  projectName: string;
}

const COMPONENTS: Components = {
  h1: ({ node, ...props }) => <h1 className="font-display text-xl font-semibold text-white" {...props} />,
  h2: ({ node, ...props }) => (
    <h2 className="mt-6 border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wider text-magenta flex items-center gap-2" {...props} />
  ),
  p: ({ node, ...props }) => <p className="mt-2 text-sm leading-relaxed text-white/75 font-normal" {...props} />,
  ul: ({ node, ...props }) => <ul className="mt-2 space-y-2 pl-4 text-sm text-white/85" {...props} />,
  ol: ({ node, ...props }) => <ol className="mt-2 space-y-2 pl-4 text-sm text-white/85" {...props} />,
  li: ({ node, ...props }) => <li className="list-disc leading-relaxed marker:text-magenta" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
  em: ({ node, ...props }) => <em className="not-italic text-white/70" {...props} />,
  code: ({ node, ...props }) => (
    <code className="rounded-md bg-white/[0.08] border border-white/10 px-2 py-0.5 font-mono text-xs text-cyan" {...props} />
  ),
};

export default function HandoffPanel({ summary, projectName }: Props) {
  const download = () => {
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const blob = new Blob([summary], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slug || "project"}-handoff.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="glass-card p-6 sm:p-8 rounded-3xl" aria-labelledby="handoff-heading">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 id="handoff-heading" className="font-display text-xl font-semibold tracking-tight text-white">
            Handoff summary
          </h2>
          <p className="mt-0.5 text-xs text-white/50">
            One-call markdown summary ready for cold start by next session
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <CopyButton value={summary} label="Copy markdown" />
          <button
            type="button"
            onClick={download}
            className="glass-pill px-3.5 py-1.5 text-xs font-medium text-white/80 transition-all hover:border-cyan/40 hover:text-white hover:shadow-[0_0_12px_rgba(34,211,238,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan gap-1.5"
          >
            <DownloadIcon className="text-white/60 text-sm" />
            <span>Download .md</span>
          </button>
        </div>
      </div>

      <div className="mt-5 max-h-[560px] overflow-y-auto pr-2">
        <Markdown components={COMPONENTS}>{summary}</Markdown>
      </div>
    </section>
  );
}