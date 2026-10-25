"use client";

import dynamic from "next/dynamic";
import GradientText from "@/components/ui/GradientText";
import MagneticButton from "@/components/ui/MagneticButton";
import { ArrowRightIcon, NodesIcon } from "@/components/ui/icons";

const MemoryCore = dynamic(() => import("@/components/three/MemoryCore"), { ssr: false });

const STATS = [
  { value: "7", label: "MCP tools" },
  { value: "90%", label: "stop threshold" },
  { value: "1", label: "call to hand off" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-14 sm:pb-20 sm:pt-20" aria-labelledby="hero-heading">
      <div className="halo" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-glass px-3 py-1 text-xs text-faint">
            <NodesIcon className="text-cyan" />
            Remote MCP server · Streamable HTTP
          </p>

          <h1
            id="hero-heading"
            className="mt-6 font-display text-[2.1rem] leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            <GradientText>Persistent memory</GradientText> for AI coding agents
          </h1>

          <p className="mt-5 max-w-xl text-base text-faint sm:text-lg">
            Your agent starts every session from zero. Context Ledger keeps the decisions, the
            progress, what broke and how much budget is left — then hands it all over in one call.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <MagneticButton href="/dashboard" ariaLabel="Open the dashboard">
              Open the dashboard
              <ArrowRightIcon />
            </MagneticButton>
            <MagneticButton href="#connect" variant="ghost">
              Connect over MCP
            </MagneticButton>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-3">
            {STATS.map((stat) => (
              <div key={stat.label} className="glass-card px-4 py-3">
                <dt className="text-[10px] uppercase tracking-wider text-faint">{stat.label}</dt>
                <dd className="mt-1 font-display text-xl text-ink">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative h-[320px] w-full sm:h-[400px] lg:h-[520px]">
          <MemoryCore />
        </div>
      </div>
    </section>
  );
}