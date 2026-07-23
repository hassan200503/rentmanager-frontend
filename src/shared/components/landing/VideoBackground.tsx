"use client";

import { useRef, useState, useEffect } from "react";

interface VideoBackgroundProps {
  videoSrc?: string;
  posterGradient?: string;
  overlay?: "dark" | "medium" | "light" | "none";
  zoom?: boolean;
  parallax?: boolean;
  environmental?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const overlayMap = {
  dark: "from-[#030712]/90 via-[#030712]/60 to-[#030712]/90",
  medium: "from-[#030712]/70 via-[#030712]/40 to-[#030712]/70",
  light: "from-[#030712]/40 via-[#030712]/20 to-[#030712]/40",
  none: "from-transparent via-transparent to-transparent",
};

export default function VideoBackground({
  videoSrc,
  posterGradient = "bg-gradient-to-br from-blue-900/60 via-slate-900/60 to-[#030712]/60",
  overlay = "dark",
  zoom = true,
  parallax = false,
  environmental = false,
  children,
  className = "",
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    if (parallax) window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [parallax]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.readyState >= 3) setLoaded(true);
    const onCanPlay = () => setLoaded(true);
    vid.addEventListener("canplay", onCanPlay);
    return () => vid.removeEventListener("canplay", onCanPlay);
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {videoSrc && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster=""
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            loaded ? "opacity-100" : "opacity-0"
          } ${zoom ? "animate-ken-burns" : ""}`}
          style={parallax ? { transform: `translateY(${scrollY * 0.15}px)` } : undefined}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      <div className={`absolute inset-0 ${posterGradient} ${loaded && videoSrc ? "opacity-0" : "opacity-100"} transition-opacity duration-1000`}>
        <div className="absolute inset-0 bg-[length:200%_200%] animate-gradient-drift" />
      </div>

      <div className={`absolute inset-0 bg-gradient-to-b ${overlayMap[overlay]} pointer-events-none`} />

      {environmental && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-aurora" />
          <div className="absolute top-[40%] right-[10%] w-64 h-64 bg-sky-400/5 rounded-full blur-3xl animate-aurora" style={{ animationDelay: "-5s" }} />
          <div className="absolute bottom-[20%] left-[40%] w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-aurora" style={{ animationDelay: "-10s" }} />
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-particle"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + i * 12}%`,
                animationDelay: `${i * 2}s`,
                animationDuration: `${8 + i * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
