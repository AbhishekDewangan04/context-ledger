"use client";

import MagneticButton from "@/components/ui/MagneticButton";
import Reveal from "@/components/ui/Reveal";
import { ArrowRightIcon } from "@/components/ui/icons";
import { useLiquidGlass } from "@/lib/hooks/use-liquid-glass";

export default function CallToAction() {
  const cardRef = useLiquidGlass<HTMLDivElement>();

  return (
    <section className="relative mx-auto max-w-6xl px-5 pb-24 sm:px-8" aria-labelledby="cta-heading">
      <Reveal>
        <div
          ref={cardRef}
          className="glass-card relative overflow-hidden px-6 py-14 text-center sm:px-14 sm:py-20 rounded-[2rem] border-white/15"
        >
          <div className="liquid-glass-sheen" aria-hidden="true" />
          <div className="halo-liquid opacity-60" aria-hidden="true" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 id="cta-heading" className="font-display text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl text-white">
              Give the next session{" "}
              <span className="text-gradient-liquid block sm:inline">the memory of the last one</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/75 leading-relaxed sm:text-lg">
              See decisions, budget warnings and a full handoff in the dashboard.
            </p>
            <div className="mt-9 flex justify-center">
              <MagneticButton href="/dashboard" ariaLabel="Open the dashboard" variant="primary">
                <span>Open the dashboard</span>
                <ArrowRightIcon className="text-sm" />
              </MagneticButton>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}