"use client";

import Reveal from "@/components/ui/Reveal";
import ToolCard, { type ToolSpec } from "@/components/landing/ToolCard";

const TOOLS: ToolSpec[] = [
  {
    name: "create_project",
    args: "name, goal",
    returns: "Opens the ledger and returns the project_id every other tool takes.",
    tone: "bg-violet",
  },
  {
    name: "log_decision",
    args: "project_id, decision, reason",
    returns: "Stores the call and the reasoning, so it is not re-litigated next session.",
    tone: "bg-violet-soft",
  },
  {
    name: "log_progress",
    args: "project_id, built, broken?, next?",
    returns: "Progress, issue and next entries in one call, each timestamped.",
    tone: "bg-cyan",
  },
  {
    name: "check_budget",
    args: "project_id, tokens_used, token_limit",
    returns: "Percent used plus the action: continue, warn, or stop_and_summarize.",
    tone: "bg-amber",
  },
  {
    name: "get_handoff_summary",
    args: "project_id",
    returns: "Markdown across six sections, ready for the next agent or a human.",
    tone: "bg-rose",
  },
];

export default function Tools() {
  return (
    <section id="tools" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="tools-heading">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.2em] text-violet-soft">The surface</p>
        <h2 id="tools-heading" className="mt-3 max-w-2xl font-display text-3xl tracking-tight sm:text-4xl">
          Five tools, no ceremony
        </h2>
        <p className="mt-4 max-w-2xl text-faint">
          Every tool returns something an agent can act on immediately. Nothing to page through,
          nothing to parse by hand.
        </p>
      </Reveal>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool, index) => (
          <ToolCard key={tool.name} tool={tool} index={index} />
        ))}
      </ul>
    </section>
  );
}