"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/** Fixed navbar height (h-16 md:h-20) plus breathing room for anchored sections. */
const NAV_OFFSET = -88;

/**
 * Lenis smooth-scroll — landing experience only (never the app layouts).
 *
 * Production hardening over the naive `new Lenis()` setup:
 *
 *  1. Stale-limit fix. Lenis caches the scroll limit (content height) on
 *     init and only re-measures on window resize. The landing page's height
 *     settles AFTER init (async 3D map, API-driven sections, fonts, the
 *     phone demo). A stale limit makes the bottom of the page — FAQ,
 *     final CTA, footer — unreachable: wheel input silently does nothing.
 *     A ResizeObserver on <body> calls `lenis.resize()` whenever content
 *     height changes, keeping the limit in sync.
 *
 *  2. `scroll-behavior: smooth` must NOT be set on `html` when Lenis is
 *     active — the browser re-smooths Lenis's per-frame updates and wheel
 *     scrolling feels laggy or unresponsive (removed in globals.css).
 *
 *  3. In-page anchor links (#how-it-works, #pricing, #faq) are intercepted
 *     and animated with `lenis.scrollTo` (navbar offset, URL kept in sync)
 *     instead of a hard native jump.
 *
 *  4. `prefers-reduced-motion` is respected: when set, Lenis is skipped
 *     entirely and native scrolling is left untouched.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Only apply Lenis smooth scroll to landing pages, not app layouts
  const shouldUseLenis = pathname === "/" || pathname.startsWith("/listings");

  useEffect(() => {
    if (!shouldUseLenis) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false, // Disable smooth scroll on touch devices
      autoRaf: true,
    });

    // Keep the scroll limit in sync with late content growth (see above).
    const resizeObserver = new ResizeObserver(() => lenis.resize());
    resizeObserver.observe(document.body);

    // Animate in-page anchors through Lenis instead of a native jump.
    const onAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const anchor = (event.target as HTMLElement).closest?.<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#" || hash === "#main-content") return;
      const target = document.querySelector<HTMLElement>(hash);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: NAV_OFFSET, duration: 1.1 });
      history.pushState(null, "", hash);
    };
    document.addEventListener("click", onAnchorClick, { passive: true });

    return () => {
      document.removeEventListener("click", onAnchorClick);
      resizeObserver.disconnect();
      lenis.destroy();
    };
  }, [shouldUseLenis]);

  return <>{children}</>;
}