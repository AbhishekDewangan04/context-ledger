"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/ui/icons";

interface Props {
  value: string;
  label?: string;
  className?: string;
}

export default function CopyButton({ value, label = "Copy", className = "" }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  const text = state === "copied" ? "Copied!" : state === "failed" ? "Copy failed" : label;

  return (
    <button
      type="button"
      onClick={copy}
      className={`glass-pill px-3 py-1.5 text-xs font-medium text-white/90 gap-1.5 transition-all duration-250 hover:border-cyan/50 hover:text-white hover:shadow-[0_0_12px_rgba(34,211,238,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${className}`}
      aria-live="polite"
    >
      {state === "copied" ? (
        <CheckIcon className="text-cyan text-sm drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
      ) : (
        <CopyIcon className="text-white/60 text-sm" />
      )}
      <span>{text}</span>
    </button>
  );
}