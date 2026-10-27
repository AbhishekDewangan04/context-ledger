"use client";

import Reveal from "@/components/ui/Reveal";
import ToolCard, { type ToolSpec } from "@/components/landing/ToolCard";

const TOOLS: ToolSpec[] = [
  {
    name: "create_project",
    args: "name, goal",
    returns: "Opens the ledger and returns the project_id every other tool takes.",
    tone: "bg-fuchsia",
  },
  {
    name: "list_projects",
    args: "—",
    returns: "Lists active projects with goal, entry count and latest budget status.",
    tone: "bg-cyan",
  },
  {
    name: "archive_project",
    args: "project_id",
    returns: "Hides finished or inactive projects from listings and the dashboard.",
    tone: "bg-slate-400",
  },
  {
    name: "log_decision",
    args: "project_id, decision, reason",
    returns: "Stores the call and the reasoning, so it is not re-litigated next session.",
    tone: "bg-purple-400",
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
    tone: "bg-amber-400",
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
    <section
      id="tools"
      className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28 scroll-mt-20 sm:scroll-mt-24"
      aria-labelledby="tools-heading"
    >
      <div className="halo opacity-30" aria-hidden="true" />

      <Reveal>
        <div className="inline-flex">
          <span className="glass-pill px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-violet-soft border-violet/30 bg-violet/10 shadow-[0_0_14px_rgba(139,92,246,0.25)]">
            The surface
          </span>
        </div>
        <h2
          id="tools-heading"
          className="mt-4 max-w-2xl font-display text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl text-white"
        >
          Seven tools, no ceremony
        </h2>
        <p className="mt-4 max-w-2xl text-base text-white/70 leading-relaxed sm:text-lg">
          Every tool returns something an agent can act on immediately. Nothing to page through,
          nothing to parse by hand.
        </p>
      </Reveal>

      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool, index) => (
          <ToolCard key={tool.name} tool={tool} index={index} />
        ))}
      </ul>
    </section>
  );
}