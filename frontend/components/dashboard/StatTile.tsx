"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

interface Props {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}

export default function StatTile({ label, value, hint, tone = "text-white" }: Props) {
  const reducedMotion = useReducedMotion();
  const match = value.match(/^(\d+)(%?)$/);
  const target = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : "";

  const [count, setCount] = useState<number | null>(() => {
    return reducedMotion ? target : (target !== null ? 0 : null);
  });

  useEffect(() => {
    if (target === null || reducedMotion) {
      setCount(target);
      return;
    }

    const controls = animate(0, target, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setCount(Math.round(latest)),
    });

    return () => controls.stop();
  }, [target, reducedMotion]);

  const displayValue = target !== null && count !== null ? `${count}${suffix}` : value;

  return (
    <div className="glass-card-interactive p-5 sm:p-6 rounded-2xl flex flex-col justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">{label}</p>
        <p className={`mt-2 font-display text-2xl sm:text-3xl font-semibold tracking-tight ${tone}`}>
          {displayValue}
        </p>
      </div>
      {hint ? (
        <p className="mt-3 text-xs text-white/50 border-t border-white/5 pt-2.5">
          {hint}
        </p>
      ) : null}
    </div>
  );
}