"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PLATEAU_TOP, getBorderCurve } from "./kenya-geo";

interface MercedesCarProps {
  simplified?: boolean;
  reducedMotion?: boolean;
}

const WHEEL_RADIUS = 0.052;
const CAR_Y = PLATEAU_TOP + 0.1;
const TRAIL_COUNT = 10;

/** Wheel positions (group X = across car, group Z = front -0.16 / rear +0.16). */
const WHEEL_POSITIONS: ReadonlyArray<{ x: number; z: number }> = [
  { x: -0.145, z: -0.16 },
  { x: 0.145, z: -0.16 },
  { x: -0.145, z: 0.16 },
  { x: 0.145, z: 0.16 },
];

/**
 * Executive sedan (Mercedes-Benz S-Class silhouette) tracing Kenya's national
 * border. Follows the same closed spline as the glowing country outline, with
 * spinning wheels, banked corners, clearcoat paint, a fading light trail and
 * warm headlight glow. No external 3D models: keeps the bundle small, offline
 * safe and stable on mobile.
 */
export function MercedesCar({ simplified = false, reducedMotion = false }: MercedesCarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wheelRefs = useRef<(THREE.Mesh | null)[]>([]);
  const trailRefs = useRef<(THREE.Mesh | null)[]>([]);
  const sim = useRef({ t: 0.04, distance: 0, bank: 0 });
  const placed = useRef(false);

  const curve = useMemo(() => getBorderCurve(), []);
  const trailWorldRef = useRef<THREE.Vector3[]>(Array.from({ length: TRAIL_COUNT }, () => new THREE.Vector3()));

  const bodyGeo = useMemo(() => buildBodyGeometry(simplified), [simplified]);
  const glassGeo = useMemo(() => buildGlassGeometry(), []);

  useFrame((frame, rawDelta) => {
    const group = groupRef.current;
    if (!group) return;

    if (reducedMotion) {
      if (!placed.current) {
        applyPose(group, curve, sim.current, 0.12);
        placed.current = true;
      }
      return;
    }

    const dt = Math.min(rawDelta, 0.05);
    const curveLen = curve.getLength();

    // Constant ground speed (arc-length uniform) — like a slow cinematic loop
    const speed = 0.46;
    sim.current.t = (sim.current.t + (dt * speed) / curveLen) % 1;
    sim.current.distance += dt * speed;

    applyPose(group, curve, sim.current, sim.current.t);

    // Spin wheels
    const spin = (sim.current.distance / WHEEL_RADIUS) % (Math.PI * 2);
    for (const wheel of wheelRefs.current) {
      if (wheel) wheel.rotation.x = spin;
    }

    // Fading ghost trail (world space, independent of car transform)
    const p = curve.getPointAt(sim.current.t);
    const tangent = curve.getTangentAt(sim.current.t);
    const ghost = new THREE.Vector3(p.x - tangent.x * 0.16, CAR_Y - 0.02, p.z - tangent.z * 0.16);
    const trail = trailWorldRef.current;
    trail.pop();
    trail.unshift(ghost);
    trailRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.position.copy(trail[i]);
      const k = 1 - i / TRAIL_COUNT;
      (mesh.material as THREE.MeshBasicMaterial).opacity = k * 0.2;
      mesh.scale.setScalar(0.03 * (2 - k));
    });
  });

  return (
    <>
      {/* Ghost trail (world-space) */}
      {!simplified && (
        <group>
          {Array.from({ length: TRAIL_COUNT }, (_, i) => (
            <mesh
              key={`trail-${i}`}
              ref={(el) => {
                trailRefs.current[i] = el;
              }}
            >
              <sphereGeometry args={[0.03, 6, 6]} />
              <meshBasicMaterial color="#6ee7b7" transparent opacity={0} depthWrite={false} />
            </mesh>
          ))}
        </group>
      )}

      <group ref={groupRef} position={[0, CAR_Y, 0]}>
        {/* Painted body shell (extruded side profile, wheel arches) */}
        <mesh geometry={bodyGeo} rotation={[0, -Math.PI / 2, 0]} castShadow={!simplified}>
          {simplified ? (
            <meshStandardMaterial color="#d7dce3" roughness={0.35} metalness={0.75} />
          ) : (
            <meshPhysicalMaterial
              color="#e3e6ea"
              metalness={0.85}
              roughness={0.22}
              clearcoat={1}
              clearcoatRoughness={0.06}
              envMapIntensity={1.4}
            />
          )}
        </mesh>

        {/* Tinted glass canopy */}
        <mesh geometry={glassGeo} rotation={[0, -Math.PI / 2, 0]}>
          {simplified ? (
            <meshStandardMaterial color="#0b1120" roughness={0.15} metalness={0.8} />
          ) : (
            <meshPhysicalMaterial color="#0a1220" metalness={1} roughness={0.04} envMapIntensity={1.6} />
          )}
        </mesh>

        {/* Chrome beltline strip */}
        {!simplified && (
          <mesh position={[0, 0.118, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <boxGeometry args={[0.24, 0.008, 0.272]} />
            <meshPhysicalMaterial color="#f2f4f6" metalness={1} roughness={0.1} />
          </mesh>
        )}

        {/* Side mirrors */}
        {!simplified &&
          [-0.17, 0.17].map((xx) => (
            <group key={`mirror-${xx}`} position={[xx, 0.118, 0.12]}>
              <mesh>
                <boxGeometry args={[0.026, 0.022, 0.036]} />
                <meshPhysicalMaterial color="#dfe3e8" metalness={0.9} roughness={0.18} />
              </mesh>
              <mesh position={[xx > 0 ? -0.016 : 0.016, 0, 0]}>
                <boxGeometry args={[0.004, 0.016, 0.03]} />
                <meshPhysicalMaterial color="#0a1220" metalness={1} roughness={0.05} />
              </mesh>
            </group>
          ))}

        {/* Wheels: tires + polished rims */}
        {WHEEL_POSITIONS.map((w, i) => (
          <group key={i} position={[w.x, WHEEL_RADIUS, w.z]}>
            <mesh
              ref={(el) => {
                wheelRefs.current[i] = el;
              }}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, 0.048, 18]} />
              <meshStandardMaterial color="#0b0e13" roughness={0.92} />
            </mesh>
            <mesh
              ref={(el) => {
                wheelRefs.current[i] = el;
              }}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.034, 0.034, 0.052, 14]} />
              <meshPhysicalMaterial color="#d9dee4" metalness={1} roughness={0.14} />
            </mesh>
            <mesh position={[0, 0, 0.029]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.014, 0.014, 0.004, 10]} />
              <meshPhysicalMaterial color="#f4f6f8" metalness={1} roughness={0.08} />
            </mesh>
          </group>
        ))}

        {/* Slim LED headlight strip + projectors */}
        <mesh position={[0, 0.052, 0.292]}>
          <boxGeometry args={[0.28, 0.012, 0.008]} />
          <meshStandardMaterial color="#fffbe6" emissive="#fff6c9" emissiveIntensity={simplified ? 1.4 : 2.8} />
        </mesh>
        {[-0.09, 0.09].map((xx) => (
          <mesh key={`hl-${xx}`} position={[xx, 0.066, 0.296]}>
            <boxGeometry args={[0.05, 0.024, 0.01]} />
            <meshStandardMaterial color="#ffffff" emissive="#fffdf0" emissiveIntensity={simplified ? 1.6 : 3.2} />
          </mesh>
        ))}

        {/* Full-width tail light bar */}
        <mesh position={[0, 0.072, -0.292]}>
          <boxGeometry args={[0.26, 0.016, 0.008]} />
          <meshStandardMaterial color="#ff3b30" emissive="#ff3b30" emissiveIntensity={simplified ? 0.8 : 1.6} />
        </mesh>

        {/* Mercedes star (hood emblem) */}
        <group position={[0, 0.098, 0.24]}>
          <mesh>
            <torusGeometry args={[0.02, 0.004, 8, 20]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.08} metalness={1} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.007, 0.028, 6]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.08} metalness={1} />
          </mesh>
        </group>

        {/* Warm driving light + subtle underglow */}
        <pointLight position={[0, 0.02, 0.4]} intensity={simplified ? 0 : 5} distance={5.5} decay={2} color="#fff3c9" />
        {!simplified && <pointLight position={[0, 0.015, -0.2]} intensity={0.8} distance={3} decay={2} color="#ff6b4a" />}
      </group>
    </>
  );
}

/** Move the car to a spline pose (position + yaw + bank). */
function applyPose(
  group: THREE.Group,
  curve: THREE.CatmullRomCurve3,
  sim: { t: number; bank: number },
  t: number
) {
  const p = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t);
  const yaw = Math.atan2(tangent.x, tangent.z);

  // Bank into corners (derived from adjacent tangents)
  const tA = (t - 0.002 + 1) % 1;
  const tB = (t + 0.002) % 1;
  const dirA = curve.getTangentAt(tA);
  const dirB = curve.getTangentAt(tB);
  const steer = Math.atan2(dirA.x * dirB.z - dirA.z * dirB.x, dirA.x * dirB.x + dirA.z * dirB.z);
  const targetBank = THREE.MathUtils.clamp(-steer * 5, -0.16, 0.16);
  sim.bank = THREE.MathUtils.damp(sim.bank, targetBank, 6, 0.05);

  const bob = Math.abs(Math.sin(t * 220)) * 0.008;
  group.position.set(p.x, CAR_Y + bob, p.z);
  group.rotation.set(0, yaw, sim.bank);
}

/**
 * Sedan side profile (X = length, +X = front; Y = up) with wheel-arch holes,
 * extruded to the car width and softly bevelled for a painted-body look.
 */
function buildBodyGeometry(simplified: boolean): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  // Counter-clockwise outer contour (front = +X)
  shape.moveTo(-0.3, 0.02);
  shape.lineTo(-0.096, 0.048);
  shape.lineTo(0.096, 0.048);
  shape.lineTo(0.3, 0.02);
  shape.lineTo(0.3, 0.036);
  shape.lineTo(0.298, 0.058);
  shape.lineTo(0.272, 0.086);
  shape.lineTo(0.214, 0.103);
  shape.lineTo(0.126, 0.118);
  shape.lineTo(0.032, 0.15);
  shape.lineTo(-0.05, 0.15);
  shape.lineTo(-0.152, 0.126);
  shape.lineTo(-0.236, 0.118);
  shape.lineTo(-0.282, 0.1);
  shape.lineTo(-0.3, 0.088);
  shape.closePath();

  // Wheel arches (clockwise holes)
  for (const ax of [-0.16, 0.16]) {
    const hole = new THREE.Path();
    hole.absarc(ax, 0.052, 0.058, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.26,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: simplified ? 0.008 : 0.012,
    bevelSize: simplified ? 0.006 : 0.01,
    bevelSegments: simplified ? 1 : 2,
  });
  geo.translate(0, 0, -0.13);
  geo.computeVertexNormals();
  return geo;
}

/** Tinted cabin glass: narrower extruded profile above the beltline. */
function buildGlassGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.148, 0.124);
  shape.lineTo(-0.048, 0.15);
  shape.lineTo(0.032, 0.15);
  shape.lineTo(0.126, 0.116);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.2,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.005,
    bevelSegments: 1,
  });
  geo.translate(0, 0, -0.1);
  geo.computeVertexNormals();
  return geo;
}
