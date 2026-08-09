"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function LenisProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Only apply Lenis smooth scroll to landing pages, not app layouts
  const shouldUseLenis = pathname === "/" || pathname.startsWith("/listings");

  useEffect(() => {
    if (!shouldUseLenis) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false, // Disable smooth scroll on touch devices
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [shouldUseLenis]);

  return <>{children}</>;
}
