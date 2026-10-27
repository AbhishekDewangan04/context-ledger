import Reveal from "@/components/ui/Reveal";

const PAINS = [
  {
    title: "Decisions evaporate",
    body: "The reason behind a trade-off lives in a chat that scrolls out of reach, so the next session re-litigates it from scratch.",
  },
  {
    title: "Budgets blow past",
    body: "Nobody notices the session is 90% through its budget until quality collapses mid-refactor.",
  },
  {
    title: "Handoffs are guesswork",
    body: "Work stops with no record of what shipped, what is broken, or what was supposed to happen next.",
  },
];

export default function Problem() {
  return (
    <section
      id="problem"
      className="relative mx-auto max-w-6xl px-5 pt-6 pb-20 sm:px-8 sm:pt-8 sm:pb-28 scroll-mt-20 sm:scroll-mt-24"
      aria-labelledby="problem-heading"
    >
      <div className="halo opacity-40" aria-hidden="true" />

      <Reveal>
        <div className="inline-flex">
          <span className="glass-pill px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-magenta border-magenta/30 bg-magenta/10 shadow-[0_0_14px_rgba(236,72,153,0.25)]">
            The problem
          </span>
        </div>
        <h2
          id="problem-heading"
          className="mt-4 max-w-2xl font-display text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl text-white"
        >
          Context dies at the context limit
        </h2>
        <p className="mt-4 max-w-2xl text-base text-white/70 leading-relaxed sm:text-lg">
          An agent that cannot remember is an agent you have to babysit. Three failures show up in
          every long build.
        </p>
      </Reveal>

      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {PAINS.map((pain, index) => (
          <li key={pain.title} className="h-full">
            <Reveal delay={index * 0.08} className="h-full">
              <div className="glass-card-interactive h-full p-7 flex flex-col justify-between rounded-3xl">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full font-mono text-xs font-semibold text-rose bg-rose/15 border border-rose/30 shadow-[0_0_12px_rgba(244,63,94,0.35)]">
                      0{index + 1}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-rose/40 animate-pulse" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-white tracking-tight">
                    {pain.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/70 font-normal">
                    {pain.body}
                  </p>
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}