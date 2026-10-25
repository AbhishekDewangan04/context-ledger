"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneQuality } from "./use-scene-quality";

function ParticleCloud({ low }: { low: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = low ? 45 : 150;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const violet = new THREE.Color("#7c3aed");
    const cyan = new THREE.Color("#22d3ee");
    const mixed = new THREE.Color();

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;

      mixed.lerpColors(violet, cyan, Math.random());
      col[i * 3] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }

    return [pos, col];
  }, [count]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.025;
      pointsRef.current.rotation.x += delta * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={low ? 0.07 : 0.09}
        vertexColors
        transparent
        opacity={0.45}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default function DashboardParticles() {
  const { pending, webgl, reducedMotion, low } = useSceneQuality();

  if (pending || !webgl || reducedMotion) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 60 }}
        dpr={low ? [1, 1.25] : [1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "low-power",
        }}
      >
        <ParticleCloud low={low} />
      </Canvas>
    </div>
  );
}
