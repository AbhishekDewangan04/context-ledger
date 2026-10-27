"use client";

import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { PointerEvent, ReactNode } from "react";
import { useRef } from "react";

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "ghost";
  className?: string;
  ariaLabel?: string;
  magnetic?: boolean;
  fullWidth?: boolean;
}

export default function MagneticButton({
  children,
  href,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  className = "",
  ariaLabel,
  magnetic = true,
  fullWidth = false,
}: Props) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 240, damping: 20, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 240, damping: 20, mass: 0.4 });

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!magnetic || reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(((event.clientX - rect.left) / rect.width - 0.5) * 16);
    y.set(((event.clientY - rect.top) / rect.height - 0.5) * 10);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:cursor-not-allowed disabled:opacity-60";
  const tone =
    variant === "primary"
      ? "glass-button-primary"
      : "glass-button-secondary";

  const classes = `${base} ${tone} ${className}`;
  const motionProps = {
    style: { x: springX, y: springY },
    onPointerMove: handleMove,
    onPointerLeave: reset,
    className: fullWidth ? "flex w-full" : "inline-flex",
  };

  if (href) {
    return (
      <motion.div ref={ref} {...motionProps}>
        <Link href={href} onClick={onClick} className={classes} aria-label={ariaLabel}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div ref={ref} {...motionProps}>
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={classes}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    </motion.div>
  );
}