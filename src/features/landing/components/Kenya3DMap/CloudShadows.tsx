"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PLATEAU_TOP, RELIEF_HEIGHT } from "./kenya-geo";

let cloudTexture: THREE.CanvasTexture | null = null;

/**
 * Soft drifting cloud shadows drawn as two huge multiply-blended planes that
 * slowly cross the terrain - the "passing weather" cue that makes the map
 * feel like live footage rather than a still render.
 */
function getCloudTexture(): THREE.CanvasTexture {
  if (cloudTexture) return cloudTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6; i++) {
    const x = ((i * 97 + 13) % 244) + 6;
    const y = ((i * 61 + 41) % 244) + 6;
    const r = 20 + ((i * 13) % 24);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
    g.addColorStop(0, "rgba(96,106,118,0.5)");
    g.addColorStop(0.6, "rgba(96,106,118,0.22)");
    g.addColorStop(1, "rgba(96,106,118,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  cloudTexture = new THREE.CanvasTexture(canvas);
  cloudTexture.wrapS = cloudTexture.wrapT = THREE.RepeatWrapping;
  cloudTexture.colorSpace = THREE.SRGBColorSpace;
  return cloudTexture;
}

export function CloudShadows({
  driftX = -0.014,
  driftY = 0.009,
  opacity = 0.28,
}: {
  driftX?: number;
  driftY?: number;
  opacity?: number;
}) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const texture = useMemo(() => getCloudTexture(), []);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const mat = materialRef.current;
    if (!mat?.map) return;
    mat.map.offset.x = (((mat.map.offset.x + dt * driftX) % 1) + 1) % 1;
    mat.map.offset.y = (((mat.map.offset.y + dt * driftY) % 1) + 1) % 1;
    mat.opacity = opacity + Math.sin(state.clock.elapsedTime * 0.18) * opacity * 0.22;
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, PLATEAU_TOP + RELIEF_HEIGHT + 0.55, 0]}
      renderOrder={3}
    >
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        premultipliedAlpha
        blending={THREE.MultiplyBlending}
      />
    </mesh>
  );
}