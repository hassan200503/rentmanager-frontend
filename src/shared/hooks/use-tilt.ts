"use client";

import { useRef, useCallback, useState, useEffect } from "react";

interface UseTiltOptions {
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  disabled?: boolean;
}

export function useTilt<T extends HTMLElement>(options: UseTiltOptions = {}) {
  const {
    maxTilt = 8,
    perspective = 1000,
    scale = 1.02,
    disabled = false,
  } = options;

  const ref = useRef<T>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const boundsRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  const handlePointerEnter = useCallback(() => {
    if (disabled || !ref.current) return;
    boundsRef.current = ref.current.getBoundingClientRect();
  }, [disabled]);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (disabled || !boundsRef.current) return;

      const { left, top, width, height } = boundsRef.current;
      const x = (e.clientX - left) / width;
      const y = (e.clientY - top) / height;

      const rotateX = (y - 0.5) * -maxTilt;
      const rotateY = (x - 0.5) * maxTilt;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        setTiltStyle({
          transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
          transition: "transform 0.1s ease-out",
        });
      });
    },
    [disabled, maxTilt, perspective, scale]
  );

  const handlePointerLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setTiltStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)",
      transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
    });
    boundsRef.current = null;
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element || disabled) return;

    element.addEventListener("pointerenter", handlePointerEnter, { passive: true });
    element.addEventListener("pointermove", handlePointerMove, { passive: true });
    element.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    return () => {
      element.removeEventListener("pointerenter", handlePointerEnter);
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerleave", handlePointerLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [disabled, handlePointerEnter, handlePointerMove, handlePointerLeave]);

  return { ref, style: tiltStyle };
}
