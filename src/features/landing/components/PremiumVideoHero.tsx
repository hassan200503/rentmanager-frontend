"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import VideoBackground from "@/shared/components/landing/VideoBackground";
import { SkylineBackground } from "./SkylineBackground";
import { usePrefersReducedMotion } from "@/features/landing/hooks/use-prefers-reduced-motion";

const PHRASES = [
  "Find your next home.",
  "Reserve it in minutes.",
  "Move in with confidence.",
] as const;

/* ── Animation timeline (ms) ─────────────────────────────────────
   entering ──▶ visible ──▶ exiting ──▶ paused ──▶ (next phrase)  */
const ENTER_MS = 800;
const DWELL_MS = 3000;
const EXIT_MS = 500;
const GAP_MS = 200;

type CyclePhase = "entering" | "visible" | "exiting" | "paused";

const PHASE_ORDER: CyclePhase[] = ["entering", "visible", "exiting", "paused"];

const PHASE_DURATION_MS: Record<CyclePhase, number> = {
  entering: ENTER_MS,
  visible: DWELL_MS,
  exiting: EXIT_MS,
  paused: GAP_MS,
};

/* "Apple snap" — anticipates the glide, then eases out at the top */
const EASE_IN: [number, number, number, number] = [0.16, 1, 0.3, 1];
/* Fade-out — accelerates up and away */
const EASE_OUT: [number, number, number, number] = [0.7, 0, 0.84, 0];

interface PremiumVideoHeroProps {
  phrases?: readonly string[];
  videoSrc?: string;
  posterSrc?: string;
  eyebrow?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Full-viewport hero: looping ambient video with a sequenced headline.
 * One phrase at a time — slide up, dwell, slide out — with a segmented
 * story-style progress bar, over a bottom-heavy contrast overlay.
 */
export function PremiumVideoHero({
  phrases = PHRASES,
  videoSrc = "/videos/hero.mp4",
  posterSrc = "/og.png",
  eyebrow,
  children,
}: PremiumVideoHeroProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phase, setPhase] = useState<CyclePhase>("entering");

  /* Phase state machine — advances one cycle (4 phases) per phrase,
     then loops back to the first phrase indefinitely. Reduced-motion
     users get a static first phrase with no cycling. */
  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setTimeout(() => {
      if (phase === "paused") {
        setPhraseIndex((current) => (current + 1) % phrases.length);
      }
      const nextIndex = (PHASE_ORDER.indexOf(phase) + 1) % PHASE_ORDER.length;
      setPhase(PHASE_ORDER[nextIndex]);
    }, PHASE_DURATION_MS[phase]);
    return () => window.clearTimeout(timer);
  }, [phase, reducedMotion, phrases.length]);

  /* Render as static when reduced motion is active — the timer never
     advances, so only the first phrase is ever shown. */
  const effectivePhase: CyclePhase = reducedMotion ? "visible" : phase;

  /* Which transform/opacity state the headline should be in right now.
     Never pass `undefined`: framer-motion reverts a missing target to
     `initial`, which would hide the phrase for the entire dwell. */
  const headlineAnimate =
    effectivePhase === "entering"
      ? { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_IN } }
      : effectivePhase === "exiting"
        ? { opacity: 0, y: -30, transition: { duration: 0.5, ease: EASE_OUT } }
        : effectivePhase === "visible"
          ? { opacity: 1, y: 0, transition: { duration: 0 } }
          : { opacity: 0, y: -30, transition: { duration: 0 } };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* preload was "auto". The video is now withheld until after page load
          (see VideoBackground and use-heavy-media-allowed), so an eager hint
          would only have it race the JavaScript that makes the page work --
          which is exactly what it used to win. */}
      <VideoBackground
        videoSrc={videoSrc}
        poster={posterSrc}
        overlay="dark"
        zoom
        environmental
        preload="metadata"
        className="absolute inset-0"
      >
        <SkylineBackground />
      </VideoBackground>

      {/* Mesh gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(41, 147, 106, 0.08) 0%, transparent 50%, rgba(138, 98, 72, 0.06) 100%)",
          mixBlendMode: "overlay",
        }}
      />

      {/* Grain texture overlay */}
      <div className="noise absolute inset-0 pointer-events-none opacity-[0.03]" />

      {/* Bottom-heavy gradient — guarantees WCAG AA contrast for white text */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#030712]/90 via-[#030712]/25 to-transparent" />

      <div className="relative w-full max-w-6xl mx-auto px-6 pt-32 pb-20 md:pt-40 text-center z-10">
        {eyebrow}

        <div className="mt-8">
          {/* Static, complete copy for assistive tech — the page's only h1. */}
          <h1 className="sr-only">{phrases.join(" ")}</h1>

          {/* The rotating visual headline is a div, not a second h1.
              It carries aria-hidden so screen readers already ignored it and
              lose nothing, but as an <h1> it still put two of them in the
              document, which crawlers and SEO audits count and flag. A
              document should have exactly one h1; this is the presentation of
              it, not a second one. */}
          <motion.div
            key={phraseIndex}
            aria-hidden="true"
            initial={{ opacity: 0, y: 40 }}
            animate={headlineAnimate}
            className="font-display font-bold text-[length:clamp(2.5rem,5vw,4.5rem)] leading-[1.1] tracking-[-0.02em] text-white min-h-[2.2em] [text-wrap:balance] [text-shadow:0_4px_30px_rgba(0,0,0,0.4)]"
          >
            {phrases[phraseIndex]}
          </motion.div>
        </div>

        {/* Segmented progress — active segment fills over the dwell */}
        <div
          className="mt-5 flex items-center justify-center gap-2"
          role="progressbar"
          aria-label="Headline progress"
          aria-valuemin={0}
          aria-valuemax={phrases.length}
          aria-valuenow={phraseIndex + 1}
        >
          {phrases.map((_, index) => {
            const isActive = index === phraseIndex;
            const filled = reducedMotion
              ? index === 0
              : isActive && effectivePhase !== "entering";
            return (
              <div
                key={index}
                className={`h-[3px] w-10 sm:w-14 overflow-hidden rounded-full bg-white/50 transition-opacity duration-500 ${
                  isActive ? "opacity-100" : "opacity-20"
                }`}
              >
                <div
                  className="h-full w-full rounded-full bg-brand-400"
                  style={{
                    transform: `scaleX(${filled ? 1 : 0})`,
                    transformOrigin: "left",
                    transition:
                      isActive && effectivePhase === "visible"
                        ? `transform ${DWELL_MS}ms linear`
                        : "transform 120ms ease",
                  }}
                />
              </div>
            );
          })}
        </div>

        {children}
      </div>
    </section>
  );
}