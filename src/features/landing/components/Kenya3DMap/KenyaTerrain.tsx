"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import {
  buildBorderPoints,
  buildCountryPlateauGeometry,
  buildCountryTopGeometry,
  PLATEAU_DEPTH,
} from "./kenya-geo";

interface KenyaTerrainProps {
  simplified?: boolean;
}

/**
 * Real Kenya satellite terrain.
 *
 * A NASA Blue Marble orthophoto (public domain, equirectangular crop) is draped
 * over an extruded country silhouette built from Natural Earth border data, so
 * the photo lines up perfectly with the real national boundary. A cyan border
 * ring and a deep gradient "ocean" complete the premium map aesthetic.
 */
export function KenyaTerrain({ simplified = false }: KenyaTerrainProps) {
  const texture = useMemo(() => {
    const t = new THREE.TextureLoader().load("/images/kenya/blue-marble-kenya.jpg");
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);
  const oceanTexture = useMemo(() => buildOceanTexture(), []);
  const topGeo = useMemo(() => buildCountryTopGeometry(), []);
  const plateauGeo = useMemo(() => buildCountryPlateauGeometry(), []);
  const border = useMemo(() => {
    const y = 0.045;
    return {
      crisp: buildBorderPoints(y),
      soft: buildBorderPoints(y - 0.012),
    };
  }, []);

  return (
    <group>
      {/* Ocean (radial gradient: jade glow under the country, deep space out) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -PLATEAU_DEPTH - 0.06, 0]}>
        <planeGeometry args={[26, 26]} />
        <meshBasicMaterial map={oceanTexture} />
      </mesh>

      {/* Country silhouette plateau */}
      <mesh geometry={plateauGeo} receiveShadow={!simplified} castShadow={!simplified}>
        <meshStandardMaterial color="#0c1611" roughness={0.85} metalness={0.12} emissive="#123a2a" emissiveIntensity={simplified ? 0.2 : 0.45} />
      </mesh>

      {/* Satellite photo on top */}
      <mesh geometry={topGeo}>
        <meshStandardMaterial map={texture} roughness={0.94} metalness={0.03} />
      </mesh>

      {/* Soft glow directly under the country */}
      {!simplified && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -PLATEAU_DEPTH - 0.02, 0]}>
          <planeGeometry args={[11, 11]} />
          <meshBasicMaterial color="#0e4630" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Cyan border highlights */}
      <Line points={border.soft} color="#0d9488" lineWidth={simplified ? 2 : 4} transparent opacity={simplified ? 0.12 : 0.22} />
      <Line points={border.crisp} color={simplified ? "#34d399" : "#6ee7b7"} lineWidth={simplified ? 0.8 : 1.3} transparent opacity={simplified ? 0.5 : 0.9} />
    </group>
  );
}

/** Cheap canvas-baked radial ocean gradient (one-time, GPU-cache friendly). */
function buildOceanTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }
  const gradient = ctx.createRadialGradient(256, 256, 8, 256, 256, 256);
  gradient.addColorStop(0, "#0c2b1e");
  gradient.addColorStop(0.35, "#071310");
  gradient.addColorStop(1, "#020409");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}