import GradientText from "@/components/ui/GradientText";
import MagneticButton from "@/components/ui/MagneticButton";
import Reveal from "@/components/ui/Reveal";
import { ArrowRightIcon } from "@/components/ui/icons";

export default function CallToAction() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8" aria-labelledby="cta-heading">
      <Reveal>
        <div className="glass-card glow-violet relative overflow-hidden px-6 py-12 text-center sm:px-12 sm:py-16">
          <div className="halo" aria-hidden="true" />
          <div className="relative">
            <h2 id="cta-heading" className="font-display text-3xl tracking-tight sm:text-4xl">
              Give the next session <GradientText>the memory of the last one</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-faint">
              Watch a seeded project move through decisions, budget warnings and a full handoff.
            </p>
            <div className="mt-8 flex justify-center">
              <MagneticButton href="/dashboard" ariaLabel="Open the dashboard">
                Open the dashboard
                <ArrowRightIcon />
              </MagneticButton>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}