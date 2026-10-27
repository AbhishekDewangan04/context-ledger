"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneQuality } from "@/components/three/use-scene-quality";

interface PointerState {
  x: number;
  y: number;
  active: boolean;
}

interface OrbSceneProps {
  pointerRef: React.MutableRefObject<PointerState>;
  reducedMotion: boolean;
  isTouch: boolean;
}

function WireframeSphere({
  pointerRef,
  reducedMotion,
  isTouch,
}: OrbSceneProps) {
  const outerGroupRef = useRef<THREE.Group>(null);
  const orbGroupRef = useRef<THREE.Group>(null);
  const innerSphereRef = useRef<THREE.LineSegments>(null);
  const particlesGroupRef = useRef<THREE.Group>(null);
  const nodesGroupRef = useRef<THREE.Group>(null);

  const idleRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });
  const currentParticlesPos = useRef({ x: 0, y: 0 });

  // 1. Geometries: Outer and Inner Icosahedron Wireframes
  const { outerWireGeo, innerWireGeo, nodePositions, outerNodes, outerLinks } =
    useMemo(() => {
      // Outer sphere (radius 1.62, detail 2)
      const outerIco = new THREE.IcosahedronGeometry(1.62, 2);
      const outerWire = new THREE.WireframeGeometry(outerIco);

      // Inner sphere (radius 1.28, detail 1)
      const innerIco = new THREE.IcosahedronGeometry(1.28, 1);
      const innerWire = new THREE.WireframeGeometry(innerIco);

      // Extract unique vertices from outer geometry for glowing nodes
      const posAttr = outerIco.attributes.position;
      const uniqueVertices: THREE.Vector3[] = [];
      const threshold = 0.05;

      for (let i = 0; i < posAttr.count; i++) {
        const v = new THREE.Vector3(
          posAttr.getX(i),
          posAttr.getY(i),
          posAttr.getZ(i)
        );
        const exists = uniqueVertices.some((u) => u.distanceTo(v) < threshold);
        if (!exists) {
          uniqueVertices.push(v);
        }
      }

      // Pick a curated constellation of vertices to match screenshot (hot pink, lavender, electric blue)
      // Node types: hot pink (#ff2bd6), lavender (#c084fc), electric blue (#3b82f6)
      const nodesData = uniqueVertices
        .filter((_, idx) => idx % 2 === 0)
        .slice(0, 18)
        .map((pos, idx) => {
          let color = "#ff2bd6"; // hot pink
          let size = 0.048;

          if (idx % 4 === 0) {
            color = "#3b82f6"; // electric blue accent
            size = 0.056;
          } else if (idx % 2 === 0) {
            color = "#d8b4fe"; // lavender
            size = 0.052;
          } else if (idx % 3 === 0) {
            color = "#ec4899"; // pink
            size = 0.042;
          }

          return { pos, color, size, phase: idx * 0.7 };
        });

      // Outer floating nodes constellation (sitting outside the main sphere: radius 2.05 - 2.35)
      const floatingOuter: Array<{
        pos: THREE.Vector3;
        color: string;
        size: number;
        phase: number;
      }> = [
        {
          pos: new THREE.Vector3(-1.3, 1.5, 0.9),
          color: "#38bdf8", // cyan/electric blue top left
          size: 0.065,
          phase: 0.2,
        },
        {
          pos: new THREE.Vector3(1.4, 1.4, 0.8),
          color: "#d8b4fe", // lavender top right
          size: 0.058,
          phase: 1.1,
        },
        {
          pos: new THREE.Vector3(1.9, -0.3, 0.9),
          color: "#38bdf8", // electric blue right
          size: 0.068,
          phase: 2.3,
        },
        {
          pos: new THREE.Vector3(1.65, -0.45, 0.4),
          color: "#c084fc", // lavender mid-right
          size: 0.045,
          phase: 3.0,
        },
        {
          pos: new THREE.Vector3(0.8, -1.8, 0.7),
          color: "#d8b4fe", // lavender bottom right
          size: 0.058,
          phase: 4.1,
        },
        {
          pos: new THREE.Vector3(-0.4, -1.65, 0.85),
          color: "#d8b4fe", // lavender bottom
          size: 0.05,
          phase: 5.2,
        },
        {
          pos: new THREE.Vector3(-1.8, 0.2, 0.8),
          color: "#d8b4fe", // lavender left
          size: 0.062,
          phase: 0.8,
        },
        {
          pos: new THREE.Vector3(-1.15, -0.9, 0.7),
          color: "#d8b4fe", // lavender lower left
          size: 0.052,
          phase: 1.9,
        },
        {
          pos: new THREE.Vector3(-0.7, 1.25, 0.85),
          color: "#c084fc", // lavender upper left
          size: 0.042,
          phase: 2.8,
        },
      ];

      // Outer connecting lines: pairs of vertices linking outer nodes to each other and sphere
      const linkPairs: THREE.Vector3[] = [];
      floatingOuter.forEach((outerNode) => {
        // Link to nearest 2 vertices on the sphere
        const sorted = [...uniqueVertices].sort(
          (a, b) => a.distanceTo(outerNode.pos) - b.distanceTo(outerNode.pos)
        );
        if (sorted[0]) linkPairs.push(outerNode.pos, sorted[0]);
        if (sorted[1]) linkPairs.push(outerNode.pos, sorted[1]);
      });

      // Also link adjacent outer nodes
      for (let i = 0; i < floatingOuter.length; i++) {
        const next = floatingOuter[(i + 1) % floatingOuter.length];
        if (floatingOuter[i].pos.distanceTo(next.pos) < 2.2) {
          linkPairs.push(floatingOuter[i].pos, next.pos);
        }
      }

      const outerLinksGeo = new THREE.BufferGeometry().setFromPoints(linkPairs);

      return {
        outerWireGeo: outerWire,
        innerWireGeo: innerWire,
        nodePositions: nodesData,
        outerNodes: floatingOuter,
        outerLinks: outerLinksGeo,
      };
    }, []);

  // 2. Floating Background Particles & Stars
  const { particleGeo, particleMat } = useMemo(() => {
    const count = 180;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorHotPink = new THREE.Color("#ff2bd6");
    const colorLavender = new THREE.Color("#d8b4fe");
    const colorViolet = new THREE.Color("#8c68f3");
    const colorBlue = new THREE.Color("#3b82f6");
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // Spherical distribution around the orb
      const radius = 2.1 + Math.random() * 2.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi) * 0.85;

      const rand = Math.random();
      if (rand < 0.4) {
        tempColor.copy(colorHotPink);
      } else if (rand < 0.7) {
        tempColor.copy(colorLavender);
      } else if (rand < 0.88) {
        tempColor.copy(colorViolet);
      } else {
        tempColor.copy(colorBlue);
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.038,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    return { particleGeo: geo, particleMat: mat };
  }, []);

  // 3. Materials
  const outerLineMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#c026d3", // vibrant magenta
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const innerLineMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#6366f1", // deep indigo/electric violet
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const outerLinksMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#8c68f3", // violet
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  // Clean up materials on unmount
  useEffect(() => {
    return () => {
      outerWireGeo.dispose();
      innerWireGeo.dispose();
      outerLinks.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      outerLineMat.dispose();
      innerLineMat.dispose();
      outerLinksMat.dispose();
    };
  }, [
    outerWireGeo,
    innerWireGeo,
    outerLinks,
    particleGeo,
    particleMat,
    outerLineMat,
    innerLineMat,
    outerLinksMat,
  ]);

  // 4. Animation loop: Idle spin, cursor tracking, parallax, pulse
  useFrame((state, delta) => {
    const step = Math.min(delta, 0.05);
    const time = state.clock.elapsedTime;

    // Idle rotation increments
    const spinSpeed = reducedMotion ? 0.02 : 0.14;
    idleRotation.current.y += step * spinSpeed;
    idleRotation.current.x = Math.sin(time * 0.45) * 0.1;

    // Pointer target calculations
    let targetX = 0;
    let targetY = 0;

    if (!reducedMotion && !isTouch && pointerRef.current.active) {
      targetX = pointerRef.current.x;
      targetY = pointerRef.current.y;
    }

    // Lerp rotation toward pointer direction
    const lerpFactor = 0.07;
    const targetRotX = idleRotation.current.x - targetY * 0.55;
    const targetRotY = idleRotation.current.y + targetX * 0.75;

    currentRotation.current.x = THREE.MathUtils.lerp(
      currentRotation.current.x,
      targetRotX,
      lerpFactor
    );
    currentRotation.current.y = THREE.MathUtils.lerp(
      currentRotation.current.y,
      targetRotY,
      lerpFactor
    );

    // Subtle parallax translation
    const targetPosX = targetX * 0.28;
    const targetPosY = targetY * 0.28;
    currentPosition.current.x = THREE.MathUtils.lerp(
      currentPosition.current.x,
      targetPosX,
      0.06
    );
    currentPosition.current.y = THREE.MathUtils.lerp(
      currentPosition.current.y,
      targetPosY,
      0.06
    );

    // Outer particles parallax (moves slightly more for 3D depth)
    const targetPartX = targetX * 0.52;
    const targetPartY = targetY * 0.52;
    currentParticlesPos.current.x = THREE.MathUtils.lerp(
      currentParticlesPos.current.x,
      targetPartX,
      0.06
    );
    currentParticlesPos.current.y = THREE.MathUtils.lerp(
      currentParticlesPos.current.y,
      targetPartY,
      0.06
    );

    // Apply transforms to main orb group
    if (orbGroupRef.current) {
      orbGroupRef.current.rotation.x = currentRotation.current.x;
      orbGroupRef.current.rotation.y = currentRotation.current.y;
      orbGroupRef.current.position.x = currentPosition.current.x;
      orbGroupRef.current.position.y = currentPosition.current.y;
    }

    // Counter-rotate inner sphere for intricate geometric depth
    if (innerSphereRef.current) {
      innerSphereRef.current.rotation.y -= step * 0.18;
      innerSphereRef.current.rotation.x += step * 0.06;
    }

    // Apply parallax to particles
    if (particlesGroupRef.current) {
      particlesGroupRef.current.position.x = currentParticlesPos.current.x;
      particlesGroupRef.current.position.y = currentParticlesPos.current.y;
      particlesGroupRef.current.rotation.y += step * 0.035;
    }

    // Subtle node twinkling pulse
    if (nodesGroupRef.current && !reducedMotion) {
      const pulse = 1 + Math.sin(time * 2.8) * 0.12;
      nodesGroupRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group ref={outerGroupRef}>
      {/* Background floating particles with extra parallax */}
      <group ref={particlesGroupRef}>
        <primitive object={new THREE.Points(particleGeo, particleMat)} />
      </group>

      {/* Main wireframe sphere & nodes */}
      <group ref={orbGroupRef}>
        {/* Outer wireframe geodesic icosahedron */}
        <primitive
          object={new THREE.LineSegments(outerWireGeo, outerLineMat)}
        />

        {/* Inner wireframe geodesic icosahedron */}
        <primitive
          ref={innerSphereRef}
          object={new THREE.LineSegments(innerWireGeo, innerLineMat)}
        />

        {/* Outer connecting lines linking satellite nodes to sphere */}
        <primitive
          object={new THREE.LineSegments(outerLinks, outerLinksMat)}
        />

        {/* Vertex & Satellite Nodes */}
        <group ref={nodesGroupRef}>
          {/* Surface Nodes */}
          {nodePositions.map((node, i) => (
            <mesh key={`node-surf-${i}`} position={node.pos}>
              <sphereGeometry args={[node.size, 14, 14]} />
              <meshBasicMaterial
                color={node.color}
                depthWrite={false}
                transparent
                opacity={0.92}
              />
            </mesh>
          ))}

          {/* Satellite Floating Nodes */}
          {outerNodes.map((node, i) => (
            <mesh key={`node-outer-${i}`} position={node.pos}>
              <sphereGeometry args={[node.size, 16, 16]} />
              <meshBasicMaterial
                color={node.color}
                depthWrite={false}
                transparent
                opacity={0.95}
              />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

export default function InteractiveOrb() {
  const { pending, webgl, reducedMotion, low } = useSceneQuality();
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalized pointer coordinates (-1 to 1) relative to hero container
  const pointerRef = useRef<PointerState>({ x: 0, y: 0, active: false });

  // Detect touch device
  const isTouch = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches
    );
  }, []);

  useEffect(() => {
    setMounted(true);

    const handleVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Track cursor movement across parent hero section
  useEffect(() => {
    if (isTouch || reducedMotion) return;

    const container = containerRef.current?.closest("section");
    if (!container) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      pointerRef.current = {
        x: Math.max(-1.2, Math.min(1.2, x)),
        y: Math.max(-1.2, Math.min(1.2, y)),
        active: true,
      };
    };

    const handlePointerLeave = () => {
      pointerRef.current = { x: 0, y: 0, active: false };
    };

    container.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    container.addEventListener("pointerleave", handlePointerLeave, {
      passive: true,
    });

    return () => {
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [isTouch, reducedMotion, mounted]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-[320px] w-full items-center justify-center sm:h-[440px] lg:h-[540px]"
      role="img"
      aria-label="Interactive 3D geodesic wireframe orb with connected nodes and floating particles that revolves toward cursor"
    >
      {/* Soft atmospheric glow bloom behind the orb (zero hard edges, seamless plum-violet blend) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        {/* Wide ambient plum/violet bloom */}
        <div className="h-[340px] w-[340px] sm:h-[460px] sm:w-[460px] lg:h-[520px] lg:w-[520px] rounded-full bg-gradient-to-tr from-[#7c3aed]/20 via-[#d946ef]/22 to-[#ff2bd6]/18 blur-[64px]" />
        {/* Core hotspot glow */}
        <div className="absolute h-[180px] w-[180px] sm:h-[260px] sm:w-[260px] rounded-full bg-[#d946ef]/15 blur-[40px]" />
      </div>

      {mounted && !pending && webgl ? (
        <Canvas
          frameloop={hidden ? "never" : "always"}
          dpr={low ? 1 : Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2)}
          camera={{ position: [0, 0, 5.2], fov: 44 }}
          gl={{
            antialias: !low,
            alpha: true,
            powerPreference: low ? "low-power" : "high-performance",
          }}
          className="h-full w-full select-none"
        >
          <WireframeSphere
            pointerRef={pointerRef}
            reducedMotion={reducedMotion}
            isTouch={isTouch}
          />
        </Canvas>
      ) : (
        /* Graceful static fallback during SSR / WebGL-unavailable */
        <div className="relative flex h-full w-full items-center justify-center">
          <div className="h-64 w-64 rounded-full border border-fuchsia/30 shadow-[0_0_50px_rgba(217,70,239,0.3)] animate-pulse" />
        </div>
      )}
    </div>
  );
}
