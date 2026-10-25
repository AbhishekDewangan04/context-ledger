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

  const rotateX = useSpring(useTransform(pointerY, [0, 1], [7, -7]), {
    stiffness: 200,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-9, 9]), {
    stiffness: 200,
    damping: 22,
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
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card group h-full p-6 [transform-style:preserve-3d]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
          tool {String(index + 1).padStart(2, "0")}
        </span>
        <span className={`h-1.5 w-1.5 rounded-full ${tool.tone}`} aria-hidden="true" />
      </div>

      <h3 className="mt-4 font-mono text-sm text-ink transition-colors group-hover:text-cyan">
        {tool.name}
      </h3>
      <p className="mt-3 font-mono text-[11px] leading-relaxed text-faint">{tool.args}</p>
      <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-faint">
        {tool.returns}
      </p>
    </motion.li>
  );
}