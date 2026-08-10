"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { usePrefersReducedMotion } from "@/features/landing/hooks/use-prefers-reduced-motion";

interface VideoBackgroundProps {
  videoSrc?: string;
  posterGradient?: string;
  overlay?: "dark" | "medium" | "light" | "none";
  zoom?: boolean;
  environmental?: boolean;
  children?: React.ReactNode;
  className?: string;
  /** Static poster frame: shown as the video's poster and (for
      prefers-reduced-motion users) as a fixed backdrop in place of video. */
  poster?: string;
  /** How eagerly the browser fetches the video. Defaults to "metadata";
      pass "auto" when the hero is the LCP element. */
  preload?: "none" | "metadata" | "auto";
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
  environmental = false,
  children,
  className = "",
  poster,
  preload = "metadata",
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  /* Pause the video when it scrolls out of view — keeps the network and
     the GPU idle off-screen. Reduced-motion users get the gradient only. */
  useEffect(() => {
    if (reducedMotion) return;
    const vid = videoRef.current;
    if (!vid || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          vid.play().catch(() => undefined);
        } else {
          vid.pause();
        }
      },
      { rootMargin: "15% 0px" }
    );
    observer.observe(vid);

    return () => {
      observer.disconnect();
      vid.pause();
    };
  }, [reducedMotion]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.readyState >= 3) setLoaded(true);
    const onCanPlay = () => setLoaded(true);
    vid.addEventListener("canplay", onCanPlay);
    return () => vid.removeEventListener("canplay", onCanPlay);
  }, []);

  const showVideo = videoSrc && !reducedMotion;
  const hideGradient = (showVideo && loaded) || (reducedMotion && Boolean(poster));

  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      {showVideo && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload={preload}
          poster={poster}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            loaded ? "opacity-100" : "opacity-0"
          } ${zoom ? "animate-ken-burns" : ""}`}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {reducedMotion && poster && (
        <Image
          src={poster}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}

      <div className={`absolute inset-0 ${posterGradient} ${hideGradient ? "opacity-0" : "opacity-100"} transition-opacity duration-1000`}>
        <div className="absolute inset-0 bg-[length:200%_200%] animate-gradient-drift" />
      </div>

      <div className={`absolute inset-0 bg-gradient-to-b ${overlayMap[overlay]} pointer-events-none`} />

      {environmental && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-aurora" />
          <div className="absolute top-[40%] right-[10%] w-64 h-64 bg-sky-400/5 rounded-full blur-3xl animate-aurora" style={{ animationDelay: "-5s" }} />
          <div className="absolute bottom-[20%] left-[40%] w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-aurora" style={{ animationDelay: "-10s" }} />
        </div>
      )}

      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}