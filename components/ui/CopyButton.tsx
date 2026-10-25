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

  const text = state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label;

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-2 rounded-full border border-line bg-glass px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-cyan/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${className}`}
      aria-live="polite"
    >
      {state === "copied" ? <CheckIcon className="text-cyan" /> : <CopyIcon className="text-faint" />}
      {text}
    </button>
  );
}