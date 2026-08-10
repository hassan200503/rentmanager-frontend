"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { KenyaTerrain } from "./KenyaTerrain";
import { CityMarker } from "./CityMarker";
import { MapLighting } from "./MapLighting";
import { AnimatedParticles } from "./AnimatedParticles";
import { MercedesCar } from "./MercedesCar";
import { CloudShadows } from "./CloudShadows";
import { CITIES, type CityDef } from "./kenya-geo";
import { usePrefersReducedMotion } from "@/features/landing/hooks/use-prefers-reduced-motion";

interface Kenya3DMapSceneProps {
  onCityHover: (city: CityDef | null) => void;
  onCityClick: (city: CityDef) => void;
  hoveredCity: string | null;
  autoRotate?: boolean;
}

/**
 * Real-satellite Kenya 3D scene with an executive sedan tracing the national
 * border. SSR-safe: every window/WebGL access lives inside the Canvas.
 * Rendering pauses while the section is off-screen (battery friendly).
 */
export function Kenya3DMapScene({
  onCityHover,
  onCityClick,
  hoveredCity,
  autoRotate = true,
}: Kenya3DMapSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const checkDevice = () => setIsMobile(window.innerWidth < 768);
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      // Defer setState to avoid synchronous update in effect
      Promise.resolve().then(() => setIsInView(true));
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: "300px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden touch-none">
      <Canvas
        shadows={!isMobile}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        frameloop={isInView ? "always" : "never"}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: isMobile ? "low-power" : "high-performance",
          preserveDrawingBuffer: false,
        }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0.2, 5.4, 9.5]} fov={42} />

          <MapLighting simplified={isMobile} />
          {!isMobile && <StudioEnvironment />}

          <KenyaTerrain simplified={isMobile} />

          {!isMobile && <CloudShadows />}

          {CITIES.map((city) => (
            <CityMarker
              key={city.name}
              city={city}
              isHovered={hoveredCity === city.name}
              onHover={() => onCityHover(city)}
              onHoverEnd={() => onCityHover(null)}
              onClick={() => onCityClick(city)}
              simplified={isMobile}
            />
          ))}

          {!isMobile && <AnimatedParticles />}
          {!prefersReducedMotion && <MercedesCar simplified={isMobile} reducedMotion={prefersReducedMotion} />}

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom
            minDistance={4.5}
            maxDistance={13.5}
            maxPolarAngle={Math.PI / 2.15}
            minPolarAngle={Math.PI / 6}
            autoRotate={autoRotate && !isMobile && !prefersReducedMotion}
            autoRotateSpeed={0.45}
            dampingFactor={0.06}
            enableDamping
            touches={{
              ONE: THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY_PAN,
            }}
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.PAN,
            }}
          />

          <fog attach="fog" args={["#030712", 14, 30]} />
        </Suspense>
      </Canvas>
    </div>
  );
}

/**
 * Local studio reflections for the car paint (clearcoat) — built from three's
 * bundled RoomEnvironment, zero network requests. Desktop only.
 */
function StudioEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    // Store scene reference to avoid mutating hook return value directly
    const sceneRef = scene;
    const pmrem = new THREE.PMREMGenerator(gl);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    // eslint-disable-next-line react-hooks/immutability
    sceneRef.environment = envMap;
    return () => {
      sceneRef.environment = null;
      envMap.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return null;
}

export { CITIES as KENYA_CITIES, type CityDef };