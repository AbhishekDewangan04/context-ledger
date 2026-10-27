"use client";

import { useEffect, useRef } from "react";

export function useLiquidGlass<T extends HTMLElement>(
  existingRef?: React.RefObject<T | null>,
) {
  const localRef = useRef<T>(null);
  const ref = existingRef || localRef;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Disable sheen on touch devices or reduced-motion
    const media = window.matchMedia(
      "(hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)",
    );
    if (media.matches) return;

    const el = ref.current;
    if (!el) return;

    let rafId: number | null = null;
    let targetX = 50;
    let targetY = 30;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      targetX = Math.max(-25, Math.min(125, x));
      targetY = Math.max(-25, Math.min(125, y));

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          el.style.setProperty("--sheen-x", `${targetX.toFixed(1)}%`);
          el.style.setProperty("--sheen-y", `${targetY.toFixed(1)}%`);
          rafId = null;
        });
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [ref]);

  return ref;
}
