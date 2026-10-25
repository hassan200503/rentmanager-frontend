"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Card with a mouse-tracking emerald spotlight. The glow position is driven
 * purely by CSS variables and a transform — no re-renders, compositor-only.
 */
export function SpotlightCard({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      style={style}
      className={`card-hover group relative rounded-2xl border border-white/15 bg-white/[0.06] p-7 ${className}`}
    >
      {children}
    </div>
  );
}