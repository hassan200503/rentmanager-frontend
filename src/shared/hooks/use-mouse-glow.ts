"use client";

import { useCallback, type RefObject } from "react";

/**
 * Returns an onMouseMove handler that sets --mouse-x and --mouse-y CSS custom properties
 * on the element, enabling the mouse-tracking glow effect on card-hover elements.
 */
export function useMouseGlow<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>
) {
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    },
    [ref]
  );

  return handleMouseMove;
}
