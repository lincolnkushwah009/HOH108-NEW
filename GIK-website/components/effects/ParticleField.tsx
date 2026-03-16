"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function useDeviceParticleCount(desktop: number) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const w = window.innerWidth;
    if (w < 768) setCount(0);
    else if (w < 1024) setCount(Math.round(desktop * 0.6));
    else setCount(desktop);
  }, [desktop]);
  return count;
}

interface ParticleSystemProps {
  count: number;
  color?: string;
  speed?: number;
  mouseInfluence?: number;
}

function Particles({
  count,
  color = "#b89d6f",
  speed = 0.02,
  mouseInfluence = 0.3,
}: ParticleSystemProps) {
  const meshRef = useRef<THREE.Points>(null);
  const { pointer } = useThree();
  const velocitiesRef = useRef<Float32Array | null>(null);
  const elapsedRef = useRef(0);

  const { positions, sizes, basePositions } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 14;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 6;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      base[i * 3] = x;
      base[i * 3 + 1] = y;
      base[i * 3 + 2] = z;
      sz[i] = 0.02 + Math.random() * 0.04;
      vel[i * 3] = 0;
      vel[i * 3 + 1] = 0;
      vel[i * 3 + 2] = 0;
    }

    velocitiesRef.current = vel;
    return { positions: pos, sizes: sz, basePositions: base };
  }, [count]);

  const positionAttr = useMemo(
    () => new THREE.BufferAttribute(positions, 3),
    [positions]
  );

  const sizeAttr = useMemo(
    () => new THREE.BufferAttribute(sizes, 1),
    [sizes]
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posArray = geo.attributes.position.array as Float32Array;
    const vel = velocitiesRef.current;
    if (!vel) return;

    elapsedRef.current += delta;
    const time = elapsedRef.current;
    const mx = pointer.x * 5;
    const my = pointer.y * 3.5;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Drift back toward base position
      const dx = basePositions[i3] - posArray[i3];
      const dy = basePositions[i3 + 1] - posArray[i3 + 1];
      const dz = basePositions[i3 + 2] - posArray[i3 + 2];

      vel[i3] += dx * 0.002;
      vel[i3 + 1] += dy * 0.002;
      vel[i3 + 2] += dz * 0.002;

      // Organic drift
      vel[i3] += Math.sin(time * speed + i * 0.1) * 0.0003;
      vel[i3 + 1] += Math.cos(time * speed * 0.8 + i * 0.15) * 0.0003;

      // Mouse repulsion
      const pmx = posArray[i3] - mx;
      const pmy = posArray[i3 + 1] - my;
      const distSq = pmx * pmx + pmy * pmy;
      const repulsionRadius = 4;

      if (distSq < repulsionRadius * repulsionRadius && distSq > 0.01) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / repulsionRadius) * mouseInfluence * 0.01;
        vel[i3] += (pmx / dist) * force;
        vel[i3 + 1] += (pmy / dist) * force;
      }

      // Apply velocity with damping
      vel[i3] *= 0.96;
      vel[i3 + 1] *= 0.96;
      vel[i3 + 2] *= 0.96;

      posArray[i3] += vel[i3];
      posArray[i3 + 1] += vel[i3 + 1];
      posArray[i3 + 2] += vel[i3 + 2];
    }

    geo.attributes.position.needsUpdate = true;

    // Slow global rotation
    meshRef.current.rotation.y = time * 0.01;
  });

  if (count === 0) return null;

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <primitive object={positionAttr} attach="attributes-position" />
        <primitive object={sizeAttr} attach="attributes-size" />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color={color}
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

interface ParticleFieldProps {
  count?: number;
  color?: string;
  speed?: number;
  mouseInfluence?: number;
  className?: string;
}

export function ParticleField({
  count = 500,
  color = "#b89d6f",
  speed = 0.02,
  mouseInfluence = 0.3,
  className,
}: ParticleFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const deviceCount = useDeviceParticleCount(count);

  // Detect WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl && containerRef.current) {
        containerRef.current.style.display = "none";
      }
    } catch {
      if (containerRef.current) {
        containerRef.current.style.display = "none";
      }
    }
  }, []);

  if (deviceCount === 0) return null;

  return (
    <div
      ref={containerRef}
      className={className || "pointer-events-none absolute inset-0 three-desktop-only"}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Particles
          count={deviceCount}
          color={color}
          speed={speed}
          mouseInfluence={mouseInfluence}
        />
      </Canvas>
    </div>
  );
}
