"use client";

interface MapLightingProps {
  simplified?: boolean;
}

/**
 * Cinematic daylight rig: a warm sun key with soft shadows, cool atmospheric
 * fill, and a whisper of brand-green rim so the terrain reads as real
 * geography shot at golden hour — not a green-tinted toy.
 */
export function MapLighting({ simplified = false }: MapLightingProps) {
  if (simplified) {
    // Mobile: simple 2-light setup
    return (
      <>
        <ambientLight intensity={0.55} color="#8b98ab" />
        <directionalLight position={[5, 8, 5]} intensity={1.6} color="#fff3e0" />
      </>
    );
  }

  // Desktop: cinematic 5-light setup
  return (
    <>
      {/* Cool base ambient + sky bounce */}
      <ambientLight intensity={0.28} color="#7d8faa" />
      <hemisphereLight color="#a3b8d4" groundColor="#0b1017" intensity={0.55} />

      {/* Warm sun key — soft, realistic shadows */}
      <directionalLight
        position={[7.5, 9.5, 4.5]}
        intensity={2.1}
        color="#fff2dc"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
      />

      {/* Cool atmospheric fill from the shadow side */}
      <directionalLight position={[-6.5, 4.5, -6]} intensity={0.45} color="#5b7db8" />

      {/* Subtle jade rim — brand accent on silhouettes */}
      <directionalLight position={[0.5, 6, -8]} intensity={0.5} color="#3fae8f" />

      {/* Soft overhead bounce for marker pops */}
      <pointLight position={[0, 10, 0]} intensity={0.35} color="#10B981" distance={16} decay={2} />

      <hemisphereLight color="#6ee7b7" groundColor="#030712" intensity={0.12} />
    </>
  );
}