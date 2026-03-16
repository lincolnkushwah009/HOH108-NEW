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

function Particles({ count }: { count: number }) {
  const meshRef = useRef<THREE.Points>(null);
  const { pointer } = useThree();
  const velocitiesRef = useRef<Float32Array | null>(null);
  const elapsedRef = useRef(0);

  const { positions, basePositions } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 14;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 8;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      base[i * 3] = x;
      base[i * 3 + 1] = y;
      base[i * 3 + 2] = z;
      vel[i * 3] = 0;
      vel[i * 3 + 1] = 0;
      vel[i * 3 + 2] = 0;
    }

    velocitiesRef.current = vel;
    return { positions: pos, basePositions: base };
  }, [count]);

  const positionAttr = useMemo(
    () => new THREE.BufferAttribute(positions, 3),
    [positions]
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
      vel[i3] += (basePositions[i3] - posArray[i3]) * 0.002;
      vel[i3 + 1] += (basePositions[i3 + 1] - posArray[i3 + 1]) * 0.002;
      vel[i3 + 2] += (basePositions[i3 + 2] - posArray[i3 + 2]) * 0.001;

      // Organic drift with unique phase per particle
      vel[i3] += Math.sin(time * 0.02 + i * 0.13) * 0.0004;
      vel[i3 + 1] += Math.cos(time * 0.018 + i * 0.17) * 0.0004;
      vel[i3 + 2] += Math.sin(time * 0.015 + i * 0.23) * 0.0002;

      // Mouse repulsion
      const dx = posArray[i3] - mx;
      const dy = posArray[i3 + 1] - my;
      const distSq = dx * dx + dy * dy;
      const repulsionRadius = 3;

      if (distSq < repulsionRadius * repulsionRadius && distSq > 0.01) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / repulsionRadius) * 0.008;
        vel[i3] += (dx / dist) * force;
        vel[i3 + 1] += (dy / dist) * force;
      }

      // Damping
      vel[i3] *= 0.96;
      vel[i3 + 1] *= 0.96;
      vel[i3 + 2] *= 0.97;

      posArray[i3] += vel[i3];
      posArray[i3 + 1] += vel[i3 + 1];
      posArray[i3 + 2] += vel[i3 + 2];
    }

    geo.attributes.position.needsUpdate = true;

    // Slow global rotation
    meshRef.current.rotation.y = time * 0.008;
    meshRef.current.rotation.x = Math.sin(time * 0.005) * 0.05;
  });

  if (count === 0) return null;

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <primitive object={positionAttr} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#b89d6f"
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function HeroParticlesInner() {
  const count = useDeviceParticleCount(800);
  if (count === 0) return null;
  return <Particles count={count} />;
}

export default function HeroParticles() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't render on mobile
    setShow(window.innerWidth >= 768);
  }, []);

  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none three-desktop-only">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: "transparent" }}
      >
        <HeroParticlesInner />
      </Canvas>
    </div>
  );
}
