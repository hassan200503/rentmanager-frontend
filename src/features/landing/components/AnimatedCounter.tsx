"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/features/landing/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/features/landing/hooks/use-prefers-reduced-motion";

export function useCountUp(end: number, duration = 1800) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const [count, setCount] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!inView || reducedMotion) return;
    let startTime: number | null = null;
    let raf: number;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(eased * end));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration, reducedMotion]);

  return { ref, count: reducedMotion ? end : count };
}

export function AnimatedCounter({
  end,
  suffix = "",
  label,
}: {
  end: number;
  suffix?: string;
  label: string;
}) {
  const { ref, count } = useCountUp(end);
  return (
    <div ref={ref} className="text-center">
      <p className="font-mono-nums text-2xl sm:text-3xl md:text-4xl font-bold text-white">
        {count.toLocaleString()}
        {suffix}
      </p>
      <p className="text-xs md:text-sm text-white/50 mt-1.5">{label}</p>
    </div>
  );
}