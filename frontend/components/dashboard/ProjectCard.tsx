"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { ProjectSummaryView } from "@/lib/api";
import { budgetActionBadge, formatRelative } from "@/lib/presentation";

interface Props {
  project: ProjectSummaryView;
  index: number;
}

export default function ProjectCard({ project, index }: Props) {
  const budget = project.latest_budget;
  const badge = budget ? budgetActionBadge(budget.action) : null;

  return (
    <motion.li
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="glass-card-interactive group rounded-3xl overflow-hidden"
    >
      <Link
        href={`/dashboard/${project.id}`}
        className="flex h-full flex-col p-6 sm:p-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-semibold leading-snug text-white transition-colors duration-200 group-hover:text-cyan">
            {project.name}
          </h2>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/5 border border-white/10 text-white/60 transition-all duration-200 group-hover:bg-cyan/15 group-hover:border-cyan/40 group-hover:text-cyan shrink-0">
            <ArrowRightIcon className="text-xs transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/70">{project.goal}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="glass-pill px-3 py-1 text-white/70">
            {project.entry_count} {project.entry_count === 1 ? "entry" : "entries"}
          </span>
          {budget && badge ? (
            <span
              className={`glass-pill px-3 py-1 font-medium ${badge.className}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dotColor}`} aria-hidden="true" />
              {budget.percent}% · {badge.label}
            </span>
          ) : (
            <span className="glass-pill px-3 py-1 text-white/50">
              no budget yet
            </span>
          )}
        </div>

        <p className="mt-auto pt-5 text-xs text-white/50 border-t border-white/5">
          Updated <time dateTime={project.updated_at}>{formatRelative(project.updated_at)}</time>
        </p>
      </Link>
    </motion.li>
  );
}