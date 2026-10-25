"use client";

import Markdown, { type Components } from "react-markdown";
import CopyButton from "@/components/ui/CopyButton";
import { DownloadIcon } from "@/components/ui/icons";

interface Props {
  summary: string;
  projectName: string;
}

const COMPONENTS: Components = {
  h1: ({ node, ...props }) => <h1 className="font-display text-lg text-ink" {...props} />,
  h2: ({ node, ...props }) => (
    <h2 className="mt-6 border-t border-line pt-4 text-[10px] uppercase tracking-wider text-violet-soft" {...props} />
  ),
  p: ({ node, ...props }) => <p className="mt-2 text-sm leading-relaxed text-faint" {...props} />,
  ul: ({ node, ...props }) => <ul className="mt-2 space-y-1.5 pl-4 text-sm text-ink" {...props} />,
  ol: ({ node, ...props }) => <ol className="mt-2 space-y-1.5 pl-4 text-sm text-ink" {...props} />,
  li: ({ node, ...props }) => <li className="list-disc leading-relaxed marker:text-faint" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-semibold text-ink" {...props} />,
  em: ({ node, ...props }) => <em className="not-italic text-faint/80" {...props} />,
  code: ({ node, ...props }) => (
    <code className="rounded bg-glass px-1.5 py-0.5 font-mono text-[11px] text-cyan" {...props} />
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
    <section className="glass-card p-6" aria-labelledby="handoff-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="handoff-heading" className="font-display text-lg tracking-tight">
          Handoff summary
        </h2>
        <div className="flex items-center gap-2">
          <CopyButton value={summary} label="Copy markdown" />
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-glass px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-cyan/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
          >
            <DownloadIcon className="text-faint" />
            Download .md
          </button>
        </div>
      </div>

      <div className="mt-4 max-h-[560px] overflow-y-auto pr-1">
        <Markdown components={COMPONENTS}>{summary}</Markdown>
      </div>
    </section>
  );
}