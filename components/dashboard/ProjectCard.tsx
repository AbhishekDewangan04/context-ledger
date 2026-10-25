"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { ProjectSummaryView } from "@/lib/api";
import { ACTION_LABEL, budgetColor, formatRelative } from "@/lib/presentation";

interface Props {
  project: ProjectSummaryView;
  index: number;
}

export default function ProjectCard({ project, index }: Props) {
  const budget = project.latest_budget;
  const tone = budget ? budgetColor(budget.percent) : null;

  return (
    <motion.li
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.4), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="glass-card group"
    >
      <Link
        href={`/dashboard/${project.id}`}
        className="flex h-full flex-col p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg leading-tight text-ink transition-colors group-hover:text-cyan">
            {project.name}
          </h2>
          <ArrowRightIcon className="mt-1 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-cyan" />
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-faint">{project.goal}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-full border border-line px-2.5 py-1 text-faint">
            {project.entry_count} {project.entry_count === 1 ? "entry" : "entries"}
          </span>
          {budget && tone ? (
            <span className={`rounded-full px-2.5 py-1 font-medium ${tone.text} bg-glass`}>
              {budget.percent}% · {ACTION_LABEL[budget.action]}
            </span>
          ) : (
            <span className="rounded-full border border-line px-2.5 py-1 text-faint">
              no budget yet
            </span>
          )}
        </div>

        <p className="mt-auto pt-4 text-xs text-faint">
          Updated <time dateTime={project.updated_at}>{formatRelative(project.updated_at)}</time>
        </p>
      </Link>
    </motion.li>
  );
}