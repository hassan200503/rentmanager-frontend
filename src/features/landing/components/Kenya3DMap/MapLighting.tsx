"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface MapLightingProps {
  simplified?: boolean;
}

/**
 * Professional lighting setup for 3D map scene
 * Combines ambient, directional, and rim lighting
 * Simplified version for mobile devices
 */
export function MapLighting({ simplified = false }: MapLightingProps) {
  const spotlightRef = useRef<THREE.SpotLight>(null);

  // Subtle spotlight movement (disabled on mobile)
  useFrame((state) => {
    if (spotlightRef.current && !simplified) {
      const t = state.clock.elapsedTime;
      spotlightRef.current.position.x = Math.sin(t * 0.3) * 2;
      spotlightRef.current.position.z = Math.cos(t * 0.3) * 2;
    }
  });

  if (simplified) {
    // Mobile: Simple 2-light setup
    return (
      <>
        <ambientLight intensity={0.5} color="#6B7280" />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.5}
          color="#FFFFFF"
        />
      </>
    );
  }

  // Desktop: Full 5-light setup
  return (
    <>
      {/* Ambient light for base visibility */}
      <ambientLight intensity={0.3} color="#4A5568" />

      {/* Main directional light (key light) */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        color="#FFFFFF"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Fill light from opposite side */}
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.4}
        color="#6EE7B7"
      />

      {/* Top light for glow on markers */}
      <pointLight
        position={[0, 10, 0]}
        intensity={0.6}
        color="#10B981"
        distance={15}
        decay={2}
      />

      {/* Rim light from behind */}
      <spotLight
        ref={spotlightRef}
        position={[0, 8, -8]}
        intensity={0.8}
        angle={Math.PI / 6}
        penumbra={0.5}
        color="#6EE7B7"
        castShadow
      />

      {/* Subtle hemisphere light for natural sky effect */}
      <hemisphereLight
        color="#6EE7B7"
        groundColor="#030712"
        intensity={0.3}
      />
    </>
  );
}
