import type { MouseEvent } from "react";

/**
 * Smoothly scrolls to in-page anchors, respecting prefers-reduced-motion,
 * and updates window history hash so already-active anchors still scroll on click.
 */
export function handleAnchorClick(
  event: MouseEvent<HTMLElement>,
  href: string,
): void {
  if (!href.startsWith("#")) return;
  event.preventDefault();
  const id = href.replace(/^#/, "");
  const element = document.getElementById(id);
  if (element) {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    element.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "start",
    });

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", href);
    }
  }
}
