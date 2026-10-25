"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState, type ReactNode } from "react";
import { useSceneQuality } from "./use-scene-quality";

interface Props {
  children: ReactNode;
  /** Size the box from the parent — always a fixed height so nothing shifts. */
  className?: string;
  label: string;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  fallback?: ReactNode;
}

/**
 * Shared canvas host: caps DPR on low-end devices and swaps in a static
 * gradient when WebGL is missing or the visitor prefers reduced motion.
 */
export default function Scene3D({
  children,
  className = "",
  label,
  cameraPosition = [0, 0, 5],
  cameraFov = 45,
  fallback = null,
}: Props) {
  const { pending, webgl, reducedMotion, low } = useSceneQuality();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handleVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  if (pending || !webgl || reducedMotion) {
    return (
      <div className={className} role="img" aria-label={label}>
        <div className="hero-fallback relative h-full w-full overflow-hidden rounded-[inherit]">
          {fallback}
        </div>
      </div>
    );
  }

  return (
    <div className={className} role="img" aria-label={label}>
      <Canvas
        frameloop={hidden ? "never" : "always"}
        dpr={low ? 1 : [1, 1.5]}
        camera={{ position: cameraPosition, fov: cameraFov }}
        gl={{
          antialias: !low,
          alpha: true,
          powerPreference: low ? "low-power" : "high-performance",
        }}
      >
        {children}
      </Canvas>
    </div>
  );
}