"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

interface Props {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}

export default function StatTile({ label, value, hint, tone = "text-ink" }: Props) {
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
    <div className="glass-card p-5">
      <p className="text-[10px] uppercase tracking-wider text-faint">{label}</p>
      <p className={`mt-2 font-display text-2xl tracking-tight ${tone}`}>{displayValue}</p>
      {hint ? <p className="mt-1 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}