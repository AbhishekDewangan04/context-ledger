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
}

const STEPS: Step[] = [
  {
    name: "Log",
    tool: "log_progress",
    body: "The agent records what it built, what broke and what comes next — typed entries, each with a timestamp.",
    Icon: NodesIcon,
    tone: "text-cyan",
  },
  {
    name: "Track budget",
    tool: "check_budget",
    body: "Tokens used against the limit, recalculated on every call and stored as a snapshot on the project.",
    Icon: GaugeIcon,
    tone: "text-violet-soft",
  },
  {
    name: "Hit 90%",
    tool: "stop_and_summarize",
    body: "Below 80 the agent keeps going. At 80 it gets a warning. At 90 the ledger tells it to stop and summarise.",
    Icon: SparkIcon,
    tone: "text-amber",
  },
  {
    name: "Hand off",
    tool: "get_handoff_summary",
    body: "One call returns markdown the next session reads cold: Started With, Built, Decisions, Fix Next, Build Next, Budget Status.",
    Icon: HandoffIcon,
    tone: "text-rose",
  },
];

export default function Steps() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24 scroll-mt-20 sm:scroll-mt-24" aria-labelledby="how-heading">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan">How it works</p>
        <h2 id="how-heading" className="mt-3 max-w-2xl font-display text-3xl tracking-tight sm:text-4xl">
          Four calls, from first commit to clean handoff
        </h2>
      </Reveal>

      <div className="relative mt-12">
        <div
          className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-violet via-cyan to-rose opacity-40 lg:block"
          aria-hidden="true"
        />

        <ol className="grid gap-6 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.name} className="relative h-full">
              <Reveal delay={index * 0.1} className="h-full">
                <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full border border-line bg-base-elevated">
                  <step.Icon className={`text-lg ${step.tone}`} />
                </span>

                <div className="glass-card mt-4 h-full p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-lg text-ink">{step.name}</h3>
                    <span className="font-mono text-[10px] uppercase text-faint">
                      step 0{index + 1}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-xs text-cyan">{step.tool}</p>
                  <p className="mt-3 text-sm leading-relaxed text-faint">{step.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}