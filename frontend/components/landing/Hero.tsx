"use client";

import MagneticButton from "@/components/ui/MagneticButton";
import InteractiveOrb from "@/components/landing/InteractiveOrb";
import {
  ArrowRightIcon,
  SignalBarsIcon,
  UserAgentIcon,
  WrenchIcon,
} from "@/components/ui/icons";
import { handleAnchorClick } from "@/lib/scroll";

const STATS = [
  {
    label: "MCP TOOLS",
    value: "7",
    Icon: WrenchIcon,
  },
  {
    label: "STOP THRESHOLD",
    value: "90%",
    Icon: SignalBarsIcon,
  },
  {
    label: "CALL TO HAND OFF",
    value: "1",
    Icon: UserAgentIcon,
  },
];

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden pb-4 pt-8 sm:pb-6 sm:pt-14 lg:pt-16"
      aria-labelledby="hero-heading"
    >
      {/* The artwork carries its own cinematic lighting; this bloom keeps it seated in the page. */}
      <div className="halo-liquid" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-x-10 gap-y-8 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:grid-rows-[auto_auto] lg:gap-y-8">
        <div className="relative z-10 lg:col-start-1 lg:row-start-1">
          {/* Top pill badge */}
          <div className="inline-flex">
            <span className="glass-pill px-3.5 py-1.5 text-xs text-white/90 gap-2 shadow-[0_0_15px_rgba(236,72,153,0.25)] border-white/15">
              <WrenchIcon className="text-magenta text-sm" />
              <span>Remote MCP server · Streamable HTTP</span>
            </span>
          </div>

          {/* Main Headline matching reference screenshot */}
          <h1
            id="hero-heading"
            className="mt-6 font-display text-[2.5rem] leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.85rem]"
          >
            <span className="text-gradient-liquid block font-medium">Persistent memory</span>
            <span className="text-white block mt-1 font-medium">for AI coding</span>
            <span className="text-white block font-medium">agents</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Your agent starts every session from zero. Context Ledger keeps the decisions, the
            progress, what broke and how much budget is left — then hands it all over in one call.
          </p>

          {/* Action buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <MagneticButton href="/dashboard" ariaLabel="Open the dashboard" variant="primary">
              <span>Open the dashboard</span>
              <ArrowRightIcon className="text-sm" />
            </MagneticButton>
            <MagneticButton
              href="#connect"
              onClick={(e) => handleAnchorClick(e, "#connect")}
              variant="ghost"
              ariaLabel="Connect over MCP"
            >
              Connect over MCP
            </MagneticButton>
          </div>

        </div>

        {/* Interactive 3D Wireframe Orb */}
        <div className="relative h-[320px] sm:h-[420px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-[540px] flex items-center justify-center">
          <InteractiveOrb />
        </div>

        <dl className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 lg:col-start-1 lg:row-start-2 lg:max-w-xl">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="glass-card-interactive flex flex-col justify-between rounded-2xl p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                  {stat.label}
                </dt>
                <stat.Icon className="text-magenta text-base shrink-0 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
              </div>
              <dd className="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
