"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "premium" | "hover";
  enableTilt?: boolean;
  tiltIntensity?: number;
  onClick?: () => void;
  as?: "div" | "article" | "section";
}

/**
 * Premium glassmorphism card with optional 3D tilt effect
 * 
 * @example
 * ```tsx
 * <GlassCard variant="premium" enableTilt>
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </GlassCard>
 * ```
 */
export function GlassCard({
  children,
  className = "",
  variant = "default",
  enableTilt = false,
  tiltIntensity = 5,
  onClick,
  as: Component = "div",
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rx = ((y - centerY) / centerY) * -tiltIntensity;
    const ry = ((x - centerX) / centerX) * tiltIntensity;

    setTilt({ rx, ry });

    // Update CSS custom properties for cursor tracking
    cardRef.current.style.setProperty("--mouse-x", `${(x / rect.width) * 100}%`);
    cardRef.current.style.setProperty("--mouse-y", `${(y / rect.height) * 100}%`);
  };

  const handleMouseLeave = () => {
    if (!enableTilt) return;
    setTilt({ rx: 0, ry: 0 });
  };

  const variantClasses = {
    default: "glass-card",
    premium: "glass-premium",
    hover: "glass-premium-hover",
  };

  const tiltStyle = enableTilt
    ? {
        "--rx": tilt.rx,
        "--ry": tilt.ry,
      }
    : {};

  return (
    <Component
      ref={cardRef}
      className={`${variantClasses[variant]} ${enableTilt ? "tilt-3d" : ""} ${className}`}
      style={tiltStyle as React.CSSProperties}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </Component>
  );
}
