"use client";

import { useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { MapPin, ArrowUpRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "./SectionHeader";
import { Kenya3DMapScene, KENYA_CITIES, type CityDef } from "./Kenya3DMap/Kenya3DMapScene";
import { GrainOverlay } from "./CoverageSection/GrainOverlay";
import { useScrollReveal } from "@/shared/hooks/useScrollReveal";
import { AnimatedGradient } from "@/shared/components/premium-3d";

/**
 * Premium 3D Kenya Coverage Map Section
 * Features interactive 3D map with city markers and info cards
 */
export function Premium3DKenyaMapSection({ grain = true }: { grain?: boolean }) {
  const [hoveredCity, setHoveredCity] = useState<CityDef | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityDef | null>(null);
  const { ref, isVisible } = useScrollReveal({ threshold: 0.15 });

  const handleCityHover = useCallback((city: CityDef | null) => {
    setHoveredCity(city);
  }, []);

  const handleCityClick = useCallback((city: CityDef) => {
    setSelectedCity(city);
  }, []);

  return (
    <section ref={ref} className="relative py-24 md:py-32 overflow-hidden coverage-section">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-jade-500/[0.04] to-transparent">
        <AnimatedGradient variant="orbs" className="absolute inset-0" />
        <div className="absolute inset-0 bg-grid-white opacity-10" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <SectionHeader
          eyebrow="Coverage"
          title="All across Kenya"
          description="Featured rentals in major cities, with verified vacancies."
        />

        <div
          className={`transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* 3D Map Container */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-square glass-premium rounded-2xl overflow-hidden relative">
                {/* Loading fallback */}
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-jade-400 animate-spin" />
                    </div>
                  }
                >
                  <Kenya3DMapScene
                    onCityHover={handleCityHover}
                    onCityClick={handleCityClick}
                    hoveredCity={hoveredCity?.name || selectedCity?.name || null}
                    autoRotate={!hoveredCity && !selectedCity}
                  />
                </Suspense>

                {/* Live-feed finish: static film grain + vignette */}
                <div className="absolute inset-0 pointer-events-none z-20" aria-hidden="true">
                  {grain && <GrainOverlay />}
                  <div className="absolute inset-0 map-vignette" />
                </div>

                {/* LIVE badge */}
                <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 rounded-md bg-black/55 backdrop-blur-sm px-2 py-1 pointer-events-none select-none">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" aria-hidden="true" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-white/90">LIVE</span>
                </div>

                {/* Instructions overlay - mobile optimized */}
                <div className="absolute bottom-4 left-4 right-4 z-30 glass-premium rounded-lg px-3 py-2 text-center pointer-events-none">
                  <p className="text-[10px] text-white/60 font-medium">
                    <span className="hidden md:inline">Drag to rotate · Scroll to zoom · Click markers for details</span>
                    <span className="md:hidden">Swipe to rotate · Pinch to zoom · Tap cities</span>
                  </p>
                </div>
                <p className="absolute top-3 right-4 z-30 text-[9px] text-white/35 font-medium pointer-events-none select-none">
                  Real satellite · LIVE terrain
                </p>
              </div>

              {/* Glow effect */}
              <div
                className="absolute -inset-4 bg-gradient-to-b from-jade-500/20 via-jade-600/10 to-transparent rounded-[2rem] blur-3xl opacity-50 -z-10"
                aria-hidden="true"
              />
            </motion.div>

            {/* City Info Cards */}
            <div className="space-y-3">
              {KENYA_CITIES.map((city, index) => (
                <CityInfoCard
                  key={city.name}
                  city={city}
                  index={index}
                  isHovered={hoveredCity?.name === city.name}
                  isSelected={selectedCity?.name === city.name}
                  isVisible={isVisible}
                  onHover={() => setHoveredCity(city)}
                  onHoverEnd={() => setHoveredCity(null)}
                  onClick={() => setSelectedCity(city)}
                />
              ))}
            </div>
          </div>

          {/* Verification Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="flex items-center justify-center gap-2 mt-12"
          >
            <span className="w-2 h-2 rounded-full bg-jade-400 animate-pulse" aria-hidden="true" />
            <p className="text-sm text-white/60 font-medium">
              Every unit is verified before it&apos;s listed
            </p>
          </motion.div>
        </div>
      </div>

      {/* Selected City Detail Modal */}
      <AnimatePresence>
        {selectedCity && (
          <CityDetailModal
            city={selectedCity}
            onClose={() => setSelectedCity(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// City Info Card Component
interface CityInfoCardProps {
  city: CityDef;
  index: number;
  isHovered: boolean;
  isSelected: boolean;
  isVisible: boolean;
  onHover: () => void;
  onHoverEnd: () => void;
  onClick: () => void;
}

function CityInfoCard({
  city,
  index,
  isHovered,
  isSelected,
  isVisible,
  onHover,
  onHoverEnd,
  onClick,
}: CityInfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={isVisible ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      <Link
        href={`/listings?location=${encodeURIComponent(city.name)}`}
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
        className={`block city-card-3d transition-all duration-300 ${
          isHovered || isSelected ? "transform scale-105" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* City icon */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                city.name === "Nairobi"
                  ? "bg-gradient-to-br from-jade-300/20 to-jade-400/20"
                  : "bg-gradient-to-br from-jade-500/20 to-jade-600/20"
              }`}
            >
              <MapPin
                className={`w-5 h-5 ${
                  city.name === "Nairobi" ? "text-jade-300" : "text-jade-400"
                }`}
              />
            </div>

            {/* City info */}
            <div>
              <h3 className="text-base font-semibold text-white">{city.name}</h3>
              <p className="text-xs text-white/50 mt-0.5">{city.description}</p>
            </div>
          </div>

          {/* Arrow */}
          <ArrowUpRight
            className={`w-5 h-5 text-white/40 transition-all ${
              isHovered || isSelected
                ? "opacity-100 translate-x-0 translate-y-0"
                : "opacity-0 -translate-x-2 translate-y-2"
            }`}
          />
        </div>
      </Link>
    </motion.div>
  );
}

// City Detail Modal Component
interface CityDetailModalProps {
  city: CityDef;
  onClose: () => void;
}

function CityDetailModal({ city, onClose }: CityDetailModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative glass-premium rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-4">
          {/* City icon */}
          <div
            className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
              city.name === "Nairobi"
                ? "bg-gradient-to-br from-jade-300/30 to-jade-400/30"
                : "bg-gradient-to-br from-jade-500/30 to-jade-600/30"
            }`}
          >
            <MapPin
              className={`w-8 h-8 ${
                city.name === "Nairobi" ? "text-jade-300" : "text-jade-400"
              }`}
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">{city.name}</h2>
            <p className="text-sm text-white/60 mt-2">{city.description}</p>
            <p className="text-xs text-white/40 mt-1">Population: {city.population}</p>
          </div>

          <Link
            href={`/listings?location=${encodeURIComponent(city.name)}`}
            className="btn-3d w-full mt-4 inline-flex items-center justify-center gap-2"
          >
            View Properties in {city.name}
            <ArrowUpRight className="w-4 h-4" />
          </Link>

          <button
            onClick={onClose}
            className="text-xs text-white/50 hover:text-white/80 transition-colors mt-2"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
