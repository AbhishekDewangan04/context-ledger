import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

/** Animated gradient text — falls back to a static gradient under reduced motion. */
export default function GradientText({ children, className = "" }: Props) {
  return <span className={`gradient-text ${className}`}>{children}</span>;
}