"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Kenyan national flag on a chrome pole, flying from the executive sedan.
 * The flag texture (stripes + crossed spears + Masai shield) is baked onto a
 * canvas at runtime — zero network requests. The cloth is a small vertex
 * mesh that waves in two overlapping travelling sine waves, with amplitude
 * falling to zero at the pole edge so it looks physically tethered.
 */

const POLE_HEIGHT = 0.26;
const FLAG_W = 0.2;
const FLAG_H = 0.105;
const SEG_X = 22;
const SEG_Y = 7;
const WAVE_AMP = 0.02;

interface KenyaCarFlagProps {
  waving?: boolean;
}

export function KenyaCarFlag({ waving = true }: KenyaCarFlagProps) {
  const clothRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => buildFlagTexture(), []);

  // Pristine rest-position array so the wave never accumulates drift
  const rest = useMemo(() => {
    const geo = new THREE.PlaneGeometry(FLAG_W, FLAG_H, SEG_X, SEG_Y);
    const arr = (geo.attributes.position.array as Float32Array).slice();
    geo.dispose();
    return arr;
  }, []);

  useFrame((state) => {
    const mesh = clothRef.current;
    if (!mesh || !waving) return;
    const t = state.clock.elapsedTime;
    const geo = mesh.geometry as THREE.BufferGeometry;
    const arr = geo.attributes.position.array as Float32Array;

    for (let i = 0; i < arr.length; i += 3) {
      const along = rest[i]; // horizontal, -W/2 (pole) .. +W/2 (free end)
      const vert = rest[i + 1]; // vertical, -H/2 .. +H/2
      // Float32 pole-edge vertices can land a hair below -W/2; Math.pow of a
      // negative base would poison the cloth with NaN, so clamp to [0, 1].
      const u = Math.max(0, (along + FLAG_W / 2) / FLAG_W); // 0 at pole, 1 at free edge

      // Two travelling waves + falloff from the pole (cloth physics feel)
      const w1 = Math.sin(along * 15 - t * 9) * 0.55;
      const w2 = Math.sin(along * 26 + t * 7 + 1.7) * 0.45;
      const flap = Math.pow(u, 1.2) * (w1 + w2) * WAVE_AMP;
      const flutter = Math.sin(along * 20 - t * 8.5) * u * 0.004;

      arr[i + 1] = vert + flap;
      arr[i] = along + flutter;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeBoundingSphere();
  });

  return (
    // Whole assembly leans slightly backward into the wind
    <group rotation={[-0.06, 0, 0]}>
      {/* Chrome pole */}
      <mesh position={[0, POLE_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.0032, 0.004, POLE_HEIGHT, 10]} />
        <meshPhysicalMaterial color="#e2e8f0" metalness={1} roughness={0.22} envMapIntensity={1.2} />
      </mesh>

      {/* Gold finial */}
      <mesh position={[0, POLE_HEIGHT + 0.004, 0]}>
        <sphereGeometry args={[0.008, 10, 10]} />
        <meshPhysicalMaterial color="#fbbf24" metalness={1} roughness={0.18} envMapIntensity={1.4} />
      </mesh>

      {/* Flag cloth tethered to the pole, streaming backward (world -Z) */}
      <mesh ref={clothRef} rotation={[0, Math.PI / 2, 0]} position={[0, POLE_HEIGHT, -FLAG_W / 2]}>
        <planeGeometry args={[FLAG_W, FLAG_H, SEG_X, SEG_Y]} />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Runtime-baked Kenya flag: black / red / green with white fimbriation and
 *  the crossed-spears-and-shield emblem centred on the red band. */
function buildFlagTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  const W = 256;
  const H = 128;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }

  const BLACK = "#111111";
  const RED = "#bb2438";
  const GREEN = "#006233";
  const WHITE = "#ffffff";

  // Bands (top -> bottom)
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, H * 0.31);
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, H * 0.31, W, H * 0.07);
  ctx.fillStyle = RED;
  ctx.fillRect(0, H * 0.38, W, H * 0.2);
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, H * 0.58, W, H * 0.07);
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, H * 0.65, W, H * 0.35);

  // Emblem: crossed spears behind the Masai shield, centred on the red band
  const cx = W / 2;
  const cy = H * 0.48;

  ctx.save();
  ctx.translate(cx, cy);

  // Spears (silver blades)
  ctx.strokeStyle = "rgba(245,245,244,0.95)";
  ctx.lineWidth = 1.6;
  for (const angle of [-0.45, 0.45]) {
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -19);
    ctx.lineTo(0, 19);
    ctx.stroke();
    ctx.restore();
  }

  // Shield
  ctx.beginPath();
  ctx.moveTo(-11.5, -12);
  ctx.quadraticCurveTo(0, -18, 11.5, -12);
  ctx.lineTo(12.5, 1);
  ctx.lineTo(0, 16);
  ctx.lineTo(-12.5, 1);
  ctx.closePath();
  ctx.fillStyle = "#101418";
  ctx.fill();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Shield detailing: white bands flanking the red centre stripe
  ctx.fillStyle = WHITE;
  ctx.fillRect(-6.5, -13, 3, 27);
  ctx.fillRect(3.5, -13, 3, 27);
  ctx.fillStyle = RED;
  ctx.fillRect(-3.5, -13, 7, 27);

  ctx.restore();

  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
