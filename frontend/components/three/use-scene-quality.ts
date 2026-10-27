"use client";

import { useEffect, useState } from "react";

export interface SceneQuality {
  /** true until the browser capabilities have been measured */
  pending: boolean;
  webgl: boolean;
  reducedMotion: boolean;
  /** low-end device: small screen, few cores or little memory */
  low: boolean;
}

const INITIAL: SceneQuality = { pending: true, webgl: false, reducedMotion: false, low: true };

function detectWebgl(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    return Boolean(context);
  } catch {
    return false;
  }
}

/**
 * Cheap device + preference probe. Drives DPR, particle counts and the
 * static-gradient fallback so mobile and low-end machines stay smooth.
 */
export function useSceneQuality(): SceneQuality {
  const [quality, setQuality] = useState<SceneQuality>(INITIAL);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cores = navigator.hardwareConcurrency ?? 8;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;

    const evaluate = () => {
      setQuality({
        pending: false,
        webgl: detectWebgl(),
        reducedMotion: motion.matches,
        low: window.innerWidth < 768 || cores <= 4 || memory <= 4,
      });
    };

    evaluate();
    motion.addEventListener("change", evaluate);
    return () => motion.removeEventListener("change", evaluate);
  }, []);

  return quality;
}