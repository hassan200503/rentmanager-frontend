"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CITIES, lonLatToWorld, PLATEAU_TOP } from "./kenya-geo";

interface AnimatedParticlesProps {
  citiesCount?: number;
}

/**
 * Slow aurora-like particle flow through Kenya's main cities, following the
 * same real corridor as the Mercedes. Cheap: one Points buffer, additive.
 */
export function AnimatedParticles({ citiesCount = CITIES.length }: AnimatedParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const cities = CITIES.slice(0, citiesCount);
    // A circular route: each city to its predecessor (the great corridor)
    const route = cities.map((c) => lonLatToWorld(c.lon, c.lat, PLATEAU_TOP + 0.15));
    const pos: number[] = [];
    const col: number[] = [];
    const px = new THREE.Color("#34d399");
    const gold = new THREE.Color("#6ee7b7");

for (let i = 0; i < route.length; i++) {
      const a = route[i];
      const b = route[(i + 1) % route.length];
      const c = i === 0 ? gold : px;
      const steps = 14;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const mid = new THREE.Vector3().lerpVectors(a, b, 0.5);
        mid.y += 0.9; // gentle arc
        const p0 = new THREE.Vector3().lerpVectors(a, mid, t);
        const p1 = new THREE.Vector3().lerpVectors(mid, b, t);
        const p = new THREE.Vector3().lerpVectors(p0, p1, t);
        const rnd = (Math.sin((pos.length + 7) * 12.9898) * 43758.5453) % 1;
        pos.push(p.x, p.y, p.z + (rnd - 0.5) * 0.06);
        col.push(c.r, c.g, c.b);
      }
    }
    return {
      positions: new Float32Array(pos),
      colors: new Float32Array(col),
    };
  }, [citiesCount]);

  useFrame((frame) => {
    if (!pointsRef.current) return;
    const t = frame.clock.elapsedTime;
    const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] += Math.sin(t * 1.4 + i * 0.35) * 0.0016;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.55}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}