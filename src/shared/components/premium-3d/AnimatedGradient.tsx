"use client";

import { type CSSProperties } from "react";

interface AnimatedGradientProps {
  variant?: "mesh" | "orbs" | "subtle";
  className?: string;
  style?: CSSProperties;
}

/**
 * Animated gradient background with floating orbs or mesh
 * 
 * @example
 * ```tsx
 * <div className="relative">
 *   <AnimatedGradient variant="mesh" />
 *   <div className="relative z-10">Content here</div>
 * </div>
 * ```
 */
export function AnimatedGradient({
  variant = "mesh",
  className = "",
  style,
}: AnimatedGradientProps) {
  if (variant === "orbs") {
    return (
      <div className={`pointer-events-none ${className}`} style={style} aria-hidden="true">
        <div className="floating-orb floating-orb-1" />
        <div className="floating-orb floating-orb-2" />
        <div className="floating-orb floating-orb-3" />
      </div>
    );
  }

  if (variant === "subtle") {
    return (
      <div 
        className={`gradient-mesh-bg ${className}`} 
        style={style}
        aria-hidden="true"
      />
    );
  }

  // Default: mesh variant
  return (
    <div 
      className={`gradient-mesh-bg ${className}`} 
      style={style}
      aria-hidden="true"
    />
  );
}
