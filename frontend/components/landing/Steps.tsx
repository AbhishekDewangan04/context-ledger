import type { ReactElement, SVGProps } from "react";
import Reveal from "@/components/ui/Reveal";
import { GaugeIcon, HandoffIcon, NodesIcon, SparkIcon } from "@/components/ui/icons";

type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactElement;

interface Step {
  name: string;
  tool: string;
  body: string;
  Icon: IconComponent;
  tone: string;
  glow: string;
  borderTone: string;
}

const STEPS: Step[] = [
  {
    name: "Log",
    tool: "log_progress",
    body: "The agent records what it built, what broke and what comes next — typed entries, each with a timestamp.",
    Icon: NodesIcon,
    tone: "text-fuchsia",
    glow: "shadow-[0_0_18px_rgba(217,70,239,0.5)]",
    borderTone: "border-fuchsia/30 bg-fuchsia/10",
  },
  {
    name: "Track budget",
    tool: "check_budget",
    body: "Tokens used against the limit, recalculated on every call and stored as a snapshot on the project.",
    Icon: GaugeIcon,
    tone: "text-violet-soft",
    glow: "shadow-[0_0_18px_rgba(192,132,252,0.5)]",
    borderTone: "border-purple-500/30 bg-purple-500/10",
  },
  {
    name: "Hit 90%",
    tool: "stop_and_summarize",
    body: "Below 80 the agent keeps going. At 80 it gets a warning. At 90 the ledger tells it to stop and summarise.",
    Icon: SparkIcon,
    tone: "text-amber",
    glow: "shadow-[0_0_18px_rgba(245,158,11,0.5)]",
    borderTone: "border-amber-500/30 bg-amber-500/10",
  },
  {
    name: "Hand off",
    tool: "get_handoff_summary",
    body: "One call returns markdown the next session reads cold: Started With, Built, Decisions, Fix Next, Build Next, Budget Status.",
    Icon: HandoffIcon,
    tone: "text-rose",
    glow: "shadow-[0_0_18px_rgba(244,63,94,0.5)]",
    borderTone: "border-rose/30 bg-rose/10",
  },
];

export default function Steps() {
  return (
    <section
      id="how"
      className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28 scroll-mt-20 sm:scroll-mt-24"
      aria-labelledby="how-heading"
    >
      <div className="halo-liquid opacity-30" aria-hidden="true" />

      <Reveal>
        <div className="inline-flex">
          <span className="glass-pill px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-fuchsia border-fuchsia/30 bg-fuchsia/10 shadow-[0_0_14px_rgba(217,70,239,0.25)]">
            How it works
          </span>
        </div>
        <h2
          id="how-heading"
          className="mt-4 max-w-2xl font-display text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl text-white"
        >
          Four calls, from first commit to clean handoff
        </h2>
      </Reveal>

      <div className="relative mt-14">
        {/* Glowing connector ribbon */}
        <div
          className="absolute left-6 right-6 top-6 hidden h-[2px] bg-gradient-to-r from-violet via-fuchsia to-magenta opacity-70 shadow-[0_0_12px_rgba(236,72,153,0.7)] lg:block"
          aria-hidden="true"
        />

        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.name} className="relative h-full">
              <Reveal delay={index * 0.1} className="h-full flex flex-col">
                <span
                  className={`relative z-10 grid h-12 w-12 place-items-center rounded-2xl border ${step.borderTone} ${step.glow} backdrop-blur-xl mb-4 transition-transform duration-200 hover:scale-105`}
                >
                  <step.Icon className={`text-xl ${step.tone}`} />
                </span>

                <div className="glass-card-interactive h-full p-6 flex flex-col justify-between rounded-3xl">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-semibold text-white">{step.name}</h3>
                      <span className="glass-pill px-2 py-0.5 font-mono text-[10px] uppercase text-white/60">
                        0{index + 1}
                      </span>
                    </div>

                    <div className="mt-3">
                      <span className="glass-pill px-2.5 py-1 font-mono text-xs text-fuchsia border-fuchsia/20 bg-fuchsia/5">
                        {step.tool}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-white/70 font-normal">
                      {step.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}