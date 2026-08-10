"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import {
  buildBorderPoints,
  buildBorderPointsOnTerrain,
  buildCountryPlateauGeometry,
  buildCountryTopGeometry,
  buildReliefGeometry,
  PLATEAU_DEPTH,
} from "./kenya-geo";

interface KenyaTerrainProps {
  simplified?: boolean;
}

/**
 * Kenya terrain: the real satellite orthophoto is draped over a displaced
 * relief mesh (mobile keeps the flat slab for performance). A border ring
 * and deep gradient "ocean" complete the premium map aesthetic.
 */
export function KenyaTerrain({ simplified = false }: KenyaTerrainProps) {
  const texture = useMemo(() => {
    const t = new THREE.TextureLoader().load("/images/kenya/blue-marble-kenya.jpg");
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);
  const oceanTexture = useMemo(() => buildOceanTexture(), []);
  const relief = useMemo(() => (!simplified ? buildReliefGeometry() : null), [simplified]);
  const topGeo = useMemo(() => (simplified ? buildCountryTopGeometry() : null), [simplified]);
  const plateauGeo = useMemo(
    () => (simplified ? buildCountryPlateauGeometry() : null),
    [simplified]
  );
  const border = useMemo(() => {
    if (simplified) {
      const y = 0.045;
      return {
        crisp: buildBorderPoints(y),
        soft: buildBorderPoints(y - 0.012),
      };
    }
    return {
      crisp: buildBorderPointsOnTerrain(0.03),
      soft: buildBorderPointsOnTerrain(0.008),
    };
  }, [simplified]);

  return (
    <group>
      {/* Ocean (radial gradient: jade glow under the country, deep space out) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -PLATEAU_DEPTH - 0.06, 0]}>
        <planeGeometry args={[26, 26]} />
        <meshBasicMaterial map={oceanTexture} />
      </mesh>

      {simplified ? (
        <>
          {/* Country silhouette plateau */}
          <mesh geometry={plateauGeo ?? undefined} receiveShadow castShadow>
            <meshStandardMaterial color="#0c1611" roughness={0.85} metalness={0.12} emissive="#123a2a" emissiveIntensity={0.2} />
          </mesh>

          {/* Flat satellite photo on top */}
          <mesh geometry={topGeo ?? undefined}>
            <meshStandardMaterial map={texture} roughness={0.94} metalness={0.03} />
          </mesh>
        </>
      ) : (
        <>
          {/* Displaced relief surface (satellite photo with real hills) */}
          <mesh geometry={relief?.surface ?? undefined} receiveShadow>
            <meshStandardMaterial map={texture} roughness={0.96} metalness={0.02} envMapIntensity={0.15} />
          </mesh>

          {/* Water-tight slab sides */}
          <mesh geometry={relief?.skirt ?? undefined}>
            <meshStandardMaterial
              color="#0a120d"
              roughness={0.9}
              metalness={0.1}
              emissive="#0d2b1d"
              emissiveIntensity={0.35}
              polygonOffset
              polygonOffsetFactor={-1}
              polygonOffsetUnits={-1}
            />
          </mesh>
        </>
      )}

      {/* Soft glow directly under the country */}
      {!simplified && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -PLATEAU_DEPTH - 0.02, 0]}>
          <planeGeometry args={[11, 11]} />
          <meshBasicMaterial color="#0e4630" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Border highlights — lifted onto the ridges on desktop */}
      <Line points={border.soft} color="#0d9488" lineWidth={simplified ? 2 : 4} transparent opacity={simplified ? 0.12 : 0.2} />
      <Line points={border.crisp} color={simplified ? "#34d399" : "#6ee7b7"} lineWidth={simplified ? 0.8 : 1.3} transparent opacity={simplified ? 0.5 : 0.85} />
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