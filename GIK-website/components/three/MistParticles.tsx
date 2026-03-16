"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function MistPlanes() {
  const groupRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);

  const planes = useMemo(() => {
    return [
      { y: -1.5, speed: 0.08, opacity: 0.05 },
      { y: 0, speed: 0.05, opacity: 0.04 },
      { y: 1.5, speed: 0.03, opacity: 0.03 },
    ];
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#b89d6f") },
        uOpacity: { value: 0.05 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;

        // Simple noise
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        void main() {
          vec2 uv = vUv;
          float n = noise(uv * 3.0 + uTime * 0.1);
          n = n * noise(uv * 5.0 - uTime * 0.05);
          float alpha = n * uOpacity;
          // Soft edges
          float edge = smoothstep(0.0, 0.3, uv.x) * smoothstep(1.0, 0.7, uv.x)
                     * smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y);
          gl_FragColor = vec4(uColor, alpha * edge);
        }
      `,
    });
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    elapsedRef.current += delta;
    const time = elapsedRef.current;
    material.uniforms.uTime.value = time;

    groupRef.current.children.forEach((child, i) => {
      child.position.x = Math.sin(time * planes[i].speed) * 2;
    });
  });

  return (
    <group ref={groupRef}>
      {planes.map((plane, i) => (
        <mesh key={i} position={[0, plane.y, -2]} material={material.clone()}>
          <planeGeometry args={[20, 6]} />
        </mesh>
      ))}
    </group>
  );
}

export default function MistParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none three-desktop-only">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: "transparent" }}
      >
        <MistPlanes />
      </Canvas>
    </div>
  );
}
