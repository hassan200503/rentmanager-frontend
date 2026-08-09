"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { lonLatToWorld, PLATEAU_TOP, type CityDef } from "./kenya-geo";

interface CityMarkerProps {
  city: CityDef;
  isHovered: boolean;
  onHover: () => void;
  onHoverEnd: () => void;
  onClick: () => void;
  simplified?: boolean;
}

/**
 * Interactive 3D city marker anchored to real geography, with a floating
 * beacon, pulsing ground glow and a billboarded HTML label.
 */
export function CityMarker({ city, isHovered, onHover, onHoverEnd, onClick, simplified = false }: CityMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const active = hovered || isHovered;

  const base = lonLatToWorld(city.lon, city.lat, PLATEAU_TOP);
  const beamHeight = 0.16 + city.importance * 0.34;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      const target = active ? 1.35 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
      groupRef.current.position.y = base.y + Math.sin(t * 1.6 + city.importance * 3) * 0.05;
    }
    if (pulseRef.current) {
      const p = 0.75 + Math.sin(t * 2.2) * 0.25;
      pulseRef.current.scale.setScalar(active ? 1.6 : p);
      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (active ? 0.75 : p * 0.45) * (simplified ? 0.6 : 1);
    }
  });

  const handleOver = () => {
    setHovered(true);
    onHover();
    document.body.style.cursor = "pointer";
  };
  const handleOut = () => {
    setHovered(false);
    onHoverEnd();
    document.body.style.cursor = "auto";
  };

  return (
    <group ref={groupRef} position={[base.x, base.y, base.z]}>
      {/* Ground pulse */}
      <mesh ref={pulseRef} position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.09, 0.17, 32]} />
        <meshBasicMaterial color={city.color} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Beacon beam */}
      <mesh position={[0, beamHeight / 2, 0]}>
        <cylinderGeometry args={[0.014, 0.028, beamHeight, 8, 1, true]} />
        <meshBasicMaterial color={city.color} transparent opacity={active ? 0.55 : 0.28} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Interactive beacon sphere */}
      <mesh
        position={[0, beamHeight, 0]}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial
          color={city.color}
          emissive={city.color}
          emissiveIntensity={active || simplified ? 2.2 : 1}
          roughness={0.15}
          metalness={0.75}
        />
      </mesh>

      {/* Label */}
      <Html
        position={[0, beamHeight + 0.34, 0]}
        center
        distanceFactor={7}
        style={{ pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap" }}
      >
        <div
          className={`transition-all duration-300 ${
            active ? "opacity-100 scale-100" : "opacity-60 scale-90"
          }`}
        >
          <div className="text-center">
            <div
              className="text-[13px] font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
              style={{ color: city.color }}
            >
              {city.name}
            </div>
            {active && (
              <div className="text-[10px] font-medium text-white/70 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                {city.population}
              </div>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
}