"use client";

import { useRef, useState, useCallback, type MouseEvent } from "react";

interface Use3DTiltOptions {
  intensity?: number;
  max?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
}

interface TiltState {
  rotateX: number;
  rotateY: number;
  scale: number;
}

/**
 * Hook for mouse-tracking 3D tilt effect
 * 
 * @example
 * ```tsx
 * const { ref, style, onMouseMove, onMouseLeave } = use3DTilt({ intensity: 10 });
 * 
 * return (
 *   <div 
 *     ref={ref} 
 *     style={style}
 *     onMouseMove={onMouseMove}
 *     onMouseLeave={onMouseLeave}
 *   >
 *     Content
 *   </div>
 * );
 * ```
 */
export function use3DTilt<T extends HTMLElement = HTMLDivElement>(
  options: Use3DTiltOptions = {}
) {
  const {
    intensity = 5,
    max = 15,
    perspective = 1200,
    scale = 1.02,
    speed = 400,
  } = options;

  const ref = useRef<T>(null);
  const [tilt, setTilt] = useState<TiltState>({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  });

  const onMouseMove = useCallback(
    (e: MouseEvent<T>) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const percentX = (x - centerX) / centerX;
      const percentY = (y - centerY) / centerY;

      const rotateY = Math.min(Math.max(percentX * intensity, -max), max);
      const rotateX = Math.min(Math.max(percentY * -intensity, -max), max);

      setTilt({
        rotateX,
        rotateY,
        scale,
      });

      // Update CSS custom properties for gradient tracking
      ref.current.style.setProperty("--mouse-x", `${(x / rect.width) * 100}%`);
      ref.current.style.setProperty("--mouse-y", `${(y / rect.height) * 100}%`);
    },
    [intensity, max, scale]
  );

  const onMouseLeave = useCallback(() => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      scale: 1,
    });
  }, []);

  const style = {
    transform: `perspective(${perspective}px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${tilt.scale})`,
    transition: `transform ${speed}ms ease-out`,
  };

  return {
    ref,
    style,
    tilt,
    onMouseMove,
    onMouseLeave,
  };
}
