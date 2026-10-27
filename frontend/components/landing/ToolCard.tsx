"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { PointerEvent } from "react";
import { useRef } from "react";

export interface ToolSpec {
  name: string;
  args: string;
  returns: string;
  tone: string;
}

interface Props {
  tool: ToolSpec;
  index: number;
}

export default function ToolCard({ tool, index }: Props) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLLIElement>(null);
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(pointerY, [0, 1], [6, -6]), {
    stiffness: 220,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-8, 8]), {
    stiffness: 220,
    damping: 24,
  });

  const handleMove = (event: PointerEvent<HTMLLIElement>) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width);
    pointerY.set((event.clientY - rect.top) / rect.height);
  };

  const reset = () => {
    pointerX.set(0.5);
    pointerY.set(0.5);
  };

  return (
    <motion.li
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card-interactive group h-full p-6 sm:p-7 flex flex-col justify-between rounded-3xl [transform-style:preserve-3d]"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="glass-pill px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/60">
            tool {String(index + 1).padStart(2, "0")}
          </span>
          <span
            className={`h-2 w-2 rounded-full ${tool.tone} shadow-[0_0_10px_currentColor]`}
            aria-hidden="true"
          />
        </div>

        <h3 className="mt-4 font-mono text-base font-semibold text-white tracking-tight transition-colors duration-200 group-hover:text-magenta">
          {tool.name}
        </h3>

        <div className="mt-2.5">
          <span className="font-mono text-xs text-white/50 tracking-wide">
            ({tool.args})
          </span>
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-xs leading-relaxed text-white/70 font-normal">
          {tool.returns}
        </p>
      </div>
    </motion.li>
  );
}