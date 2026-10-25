"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PLATEAU_DEPTH } from "./kenya-geo";

let shimmerTexture: THREE.CanvasTexture | null = null;

/** Sparse soft glints, baked once and reused across mounts. */
function getShimmerTexture(): THREE.CanvasTexture {
  if (shimmerTexture) return shimmerTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 1 + Math.random() * 2.2;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
    g.addColorStop(0, "rgba(170,235,210,0.4)");
    g.addColorStop(1, "rgba(170,235,210,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  shimmerTexture = new THREE.CanvasTexture(canvas);
  shimmerTexture.wrapS = shimmerTexture.wrapT = THREE.RepeatWrapping;
  return shimmerTexture;
}

/**
 * Slow specular glints drifting across the Indian Ocean — the final cue that
 * turns the static gradient into real water. One additive plane, no shaders.
 */
export function OceanShimmer() {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const texture = useMemo(() => getShimmerTexture(), []);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const mat = materialRef.current;
    if (!mat?.map) return;
    mat.map.offset.x = (((mat.map.offset.x + dt * 0.007) % 1) + 1) % 1;
    mat.map.offset.y = (((mat.map.offset.y + dt * 0.005) % 1) + 1) % 1;
    mat.opacity = 0.14 + Math.sin(state.clock.elapsedTime * 0.3) * 0.04;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -PLATEAU_DEPTH - 0.03, 0]} renderOrder={1}>
      <planeGeometry args={[26, 26]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={0.14}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
