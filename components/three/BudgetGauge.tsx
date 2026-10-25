"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Scene3D from "./Scene3D";
import { budgetColor } from "@/lib/presentation";

const SEGMENTS = 72;
const RADIUS = 1;
const DIM = new THREE.Color("#26263a");

function GaugeScene({ percent }: { percent: number }) {
  const group = useRef<THREE.Group>(null);
  const materials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const current = useRef(0);
  const { pointer } = useThree();

  const clamped = Math.max(0, Math.min(120, percent));
  const fill = useMemo(() => new THREE.Color(budgetColor(clamped).hex), [clamped]);
  const geometry = useMemo(() => new THREE.BoxGeometry(0.062, 0.07, 0.05), []);

  const segments = useMemo(() => {
    const step = (Math.PI * 2) / SEGMENTS;
    return Array.from({ length: SEGMENTS }, (_, index) => {
      const angle = Math.PI / 2 - (index + 0.5) * step;
      return {
        position: [Math.cos(angle) * RADIUS, Math.sin(angle) * RADIUS, 0] as [number, number, number],
        rotation: angle + Math.PI / 2,
      };
    });
  }, []);

  useFrame((state, delta) => {
    const step = Math.min(delta, 0.05);

    current.current += ((clamped / 100) * SEGMENTS - current.current) * Math.min(1, step * 2.2);

    materials.current.forEach((material, index) => {
      if (!material) return;
      const intensity = Math.max(0, Math.min(1, current.current - index));
      material.color.copy(DIM).lerp(fill, intensity);
      material.opacity = 0.28 + intensity * 0.72;
    });

    if (group.current) {
      group.current.rotation.z += step * 0.05;
      group.current.rotation.x = pointer.y * -0.12;
      group.current.rotation.y = pointer.x * 0.16;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.02;
    }
  });

  return (
    <group ref={group}>
      {segments.map((segment, index) => (
        <mesh
          key={`segment-${index}`}
          position={segment.position}
          rotation={[0, 0, segment.rotation]}
          geometry={geometry}
        >
          <meshBasicMaterial
            ref={(material) => {
              materials.current[index] = material;
            }}
            transparent
            opacity={0.3}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Ring gauge that fills clockwise from the top, coloured by the same 80/90 thresholds. */
export default function BudgetGauge({
  percent,
  className = "",
}: {
  percent: number;
  className?: string;
}) {
  const clampedPercent = Math.max(0, Math.min(100, Math.round(percent)));
  const tone = budgetColor(percent);

  return (
    <Scene3D
      className={`relative ${className}`}
      label={`Budget used: ${clampedPercent} percent. Status: ${tone.label}.`}
      cameraPosition={[0, 0, 3.4]}
      cameraFov={45}
      fallback={
        <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
          <div
            className="h-36 w-36 rounded-full sm:h-44 sm:w-44"
            style={{
              background: `conic-gradient(${tone.hex} ${clampedPercent * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
              mask: "radial-gradient(circle, transparent 58%, black 60%)",
              WebkitMask: "radial-gradient(circle, transparent 58%, black 60%)",
            }}
          />
        </div>
      }
    >
      <GaugeScene percent={percent} />
    </Scene3D>
  );
}