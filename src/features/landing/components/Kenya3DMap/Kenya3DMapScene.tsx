"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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
import { OceanShimmer } from "./OceanShimmer";
import { CinematicIntro } from "./CinematicIntro";
import { CITIES, type CityDef } from "./kenya-geo";
import { KENYA_BBOX, KENYA_MAIN_LAND } from "./kenya-outline";
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
 *
 * Performance & smoothness:
 * - The WebGL context is created only once the section approaches the
 *   viewport (no upfront GPU cost, no scroll jank).
 * - A Kenya silhouette poster cross-fades into the first rendered frame.
 * - Rendering pauses while the section is off-screen (battery friendly).
 * - A cinematic dolly-in plays on first view, then hands over to the user.
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
  const [mounted, setMounted] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
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

  // Mount the WebGL canvas only when the section nears the viewport
  useEffect(() => {
    if (!isInView || mounted) return;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [isInView, mounted]);

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-2xl overflow-hidden touch-none bg-[#04120c]">
      {/* Poster — cross-fades out on the first rendered frame */}
      <div
        className={`absolute inset-0 z-10 transition-opacity duration-700 ${
          frameReady ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-hidden="true"
      >
        <MapPoster />
      </div>

      {mounted && (
        <div className={`absolute inset-0 transition-opacity duration-700 ${frameReady ? "opacity-100" : "opacity-0"}`}>
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
            onCreated={() => {
              // Grace period for the suspendable satellite texture, then reveal
              window.setTimeout(() => setFrameReady(true), 260);
            }}
          >
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[0.2, 5.4, 9.5]} fov={42} />

              <MapLighting simplified={isMobile} />
              {!isMobile && <StudioEnvironment />}

              <KenyaTerrain simplified={isMobile} />

              {!isMobile && <CloudShadows />}
              {!isMobile && <OceanShimmer />}

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

              {/* Establishing shot on first view (locks controls while it plays) */}
              <CinematicIntro enabled={isInView && !prefersReducedMotion} />

              <fog attach="fog" args={["#030712", 14, 30]} />
            </Suspense>
          </Canvas>
        </div>
      )}
    </div>
  );
}

/** Kenya silhouette poster shown until the WebGL scene renders. */
function MapPoster() {
  const d = useMemo(() => {
    const scale = 96 / (KENYA_BBOX.east - KENYA_BBOX.west);
    const px = (lon: number) => (lon - KENYA_BBOX.west) * scale;
    const py = (lat: number) => (KENYA_BBOX.north - lat) * scale;
    const path = KENYA_MAIN_LAND.map(([lon, lat], i) =>
      `${i === 0 ? "M" : "L"}${px(lon).toFixed(2)} ${py(lat).toFixed(2)}`
    ).join(" ");
    return `${path} Z`;
  }, []);

  const viewBox = useMemo(() => {
    const scale = 96 / (KENYA_BBOX.east - KENYA_BBOX.west);
    return `0 0 96 ${((KENYA_BBOX.north - KENYA_BBOX.south) * scale).toFixed(1)}`;
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[radial-gradient(ellipse_at_center,#0a2318_0%,#04120c_72%)]">
      <svg viewBox={viewBox} className="h-28 w-auto opacity-90" aria-hidden="true">
        <defs>
          <linearGradient id="poster-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>
        <path
          d={d}
          fill="url(#poster-grad)"
          fillOpacity="0.16"
          stroke="url(#poster-grad)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/50">Loading live terrain</p>
      </div>
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
