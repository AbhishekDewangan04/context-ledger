"use client";

import { useMemo, useRef } from "react";
import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Scene3D from "./Scene3D";
import { useSceneQuality } from "./use-scene-quality";

const ORBIT_NODES = 14;
const LINK_DISTANCE = 2.55;
const SHELL_RADIUS = 1.55;
const NODE_RADIUS = 1.88;

function CoreGlow() {
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
      <div className="h-40 w-40 rounded-full border border-violet/40 blur-[1px] sm:h-52 sm:w-52" />
      <div className="absolute h-24 w-24 rounded-full border border-cyan/40 sm:h-32 sm:w-32" />
    </div>
  );
}

function CoreScene() {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();
  const { low } = useSceneQuality();

  const nodeCount = low ? 8 : ORBIT_NODES;
  const particleCount = low ? 260 : 780;

  const nodes = useMemo(() => {
    const golden = Math.PI * (1 + Math.sqrt(5));
    return Array.from({ length: nodeCount }, (_, index) => {
      const phi = Math.acos(1 - (2 * (index + 0.5)) / nodeCount);
      const theta = golden * index;
      return new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta),
      ).multiplyScalar(NODE_RADIUS);
    });
  }, [nodeCount]);

  const links = useMemo(() => {
    const pairs: Array<[THREE.Vector3, THREE.Vector3]> = [];
    nodes.forEach((node, index) => {
      nodes.slice(index + 1).forEach((other) => {
        if (node.distanceTo(other) <= LINK_DISTANCE) pairs.push([node, other]);
      });
    });
    return pairs;
  }, [nodes]);

  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const radius = 3.1 + Math.random() * 3.6;
      const theta = Math.random() * Math.PI * 2;
      positions[index * 3] = Math.cos(theta) * radius;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 7;
      positions[index * 3 + 2] = Math.sin(theta) * radius;
    }
    return positions;
  }, [particleCount]);

  useFrame((state, delta) => {
    const step = Math.min(delta, 0.05);
    const scroll = window.scrollY / Math.max(window.innerHeight, 1);

    if (group.current) {
      group.current.rotation.y += step * 0.1 + pointer.x * step * 0.7;
      group.current.rotation.x += (-pointer.y * 0.35 - group.current.rotation.x) * step * 2.2;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.08 - scroll * 0.45;
    }

    if (shell.current) {
      shell.current.rotation.y -= step * 0.22;
      shell.current.rotation.z += step * 0.04;
    }
  });

  return (
    <group ref={group}>
      <mesh ref={shell}>
        <icosahedronGeometry args={[SHELL_RADIUS, low ? 1 : 2]} />
        <meshBasicMaterial color="#7C3AED" wireframe transparent opacity={0.5} depthWrite={false} />
      </mesh>

      <mesh scale={0.82}>
        <icosahedronGeometry args={[SHELL_RADIUS, 1]} />
        <meshBasicMaterial color="#22D3EE" wireframe transparent opacity={0.16} depthWrite={false} />
      </mesh>

      <group>
        {nodes.map((node, index) => (
          <mesh key={`node-${index}`} position={node}>
            <sphereGeometry args={[low ? 0.035 : 0.045, 12, 12]} />
            <meshBasicMaterial color={index % 3 === 0 ? "#22D3EE" : "#A78BFA"} depthWrite={false} />
          </mesh>
        ))}
        {links.map(([from, to], index) => (
          <Line
            key={`link-${index}`}
            points={[from, to]}
            color="#7C3AED"
            transparent
            opacity={0.3}
            lineWidth={1}
          />
        ))}
      </group>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={low ? 0.022 : 0.03}
          color="#22D3EE"
          transparent
          opacity={0.55}
          depthWrite={false}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/**
 * Self-contained hero scene — canvas included, so the whole 3D stack can be
 * pulled in with a dynamic import (ssr: false).
 */
export default function MemoryCore() {
  return (
    <Scene3D
      className="h-full w-full"
      label="Animated memory core: a glowing wireframe icosahedron with linked orbiting nodes that reacts to your cursor and scroll"
      cameraPosition={[0, 0, 5]}
      fallback={<CoreGlow />}
    >
      <CoreScene />
    </Scene3D>
  );
}