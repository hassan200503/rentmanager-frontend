"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Decides whether Layer 2/3 animations may run, based on:
 * - `prefers-reduced-motion` (hard stop)
 * - `navigator.connection.saveData` (hard stop)
 * - low CPU core count (motion only while the section is actually on screen)
 * - IntersectionObserver (pause when scrolled out of view)
 * - `visibilitychange` (pause when the tab is hidden)
 *
 * The grain overlay is static and unaffected by this — it always renders.
 */
export function useShouldAnimate(
  sectionRef: RefObject<HTMLElement | null>
): boolean {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const saveData =
      (navigator as { connection?: { saveData?: boolean } }).connection
        ?.saveData === true;
    const lowCoreCount =
      navigator.hardwareConcurrency !== undefined &&
      navigator.hardwareConcurrency <= 4;

    if (prefersReducedMotion || saveData) {
      // Defer setState to avoid a synchronous update inside the effect
      Promise.resolve().then(() => setShouldAnimate(false));
      return;
    }

    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShouldAnimate(entry.isIntersecting && !lowCoreCount),
      { threshold: 0.1 }
    );
    observer.observe(el);

    const handleVisibility = () => {
      if (document.hidden) setShouldAnimate(false);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [sectionRef]);

  return shouldAnimate;
}
