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
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24 scroll-mt-20 sm:scroll-mt-24"
      aria-labelledby="problem-heading"
    >
      <Reveal>
        <p className="text-xs uppercase tracking-[0.2em] text-violet-soft">The problem</p>
        <h2
          id="problem-heading"
          className="mt-3 max-w-2xl font-display text-3xl tracking-tight sm:text-4xl"
        >
          Context dies at the context limit
        </h2>
        <p className="mt-4 max-w-2xl text-faint">
          An agent that cannot remember is an agent you have to babysit. Three failures show up in
          every long build.
        </p>
      </Reveal>

      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {PAINS.map((pain, index) => (
          <li key={pain.title} className="h-full">
            <Reveal delay={index * 0.08} className="h-full">
              <div className="glass-card h-full p-6">
                <span className="font-mono text-xs text-rose">0{index + 1}</span>
                <h3 className="mt-3 font-display text-lg text-ink">{pain.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-faint">{pain.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}