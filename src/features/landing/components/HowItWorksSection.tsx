"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { STEP_ITEMS } from "@/features/landing/data/content";
import { SectionHeader } from "./SectionHeader";
import { useInView } from "@/features/landing/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/features/landing/hooks/use-prefers-reduced-motion";

gsap.registerPlugin(ScrollTrigger);

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const { ref, inView } = useInView<HTMLDivElement>(0.1);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (prefersReducedMotion || !pathRef.current) return;

      const path = pathRef.current;
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "center 55%",
          scrub: 1,
        },
      });
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion] }
  );

  return (
    <section id="how-it-works" ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid-white opacity-20 pointer-events-none" aria-hidden="true" />
      <div className="relative max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Simple process"
          title="From search to move-in in four steps"
          description="No brokers, no paperwork, no stress."
        />

        <div className="relative">
          {/* Scroll-drawn connector path (desktop) */}
          <svg
            className="hidden md:block absolute top-[88px] left-[12.5%] right-[12.5%] h-16 pointer-events-none"
            viewBox="0 0 1000 100"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
            style={{ overflow: "visible" }}
          >
            <path
              ref={pathRef}
              d="M 40 50 L 320 50 L 480 50 L 680 50 L 960 50"
              stroke="rgba(41, 147, 106, 0.35)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          <div
            ref={ref}
            className={`grid md:grid-cols-4 gap-12 md:gap-8 transition-all duration-700 ${
              inView ? "opacity-100" : "opacity-0"
            }`}
          >
            {STEP_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="relative text-center" style={{ transitionDelay: `${i * 90}ms` }}>
                  {/* Watermark step number */}
                  <span
                    className="absolute -top-4 left-1/2 -translate-x-1/2 font-display text-[6rem] leading-none font-bold text-white/[0.05] select-none pointer-events-none"
                    aria-hidden="true"
                  >
                    {item.step}
                  </span>

                  <div
                    className={`relative w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br ${item.color} border border-white/10 flex items-center justify-center animate-float shadow-2xl shadow-black/30`}
                    style={{ animationDelay: `${i * 0.5}s` }}
                  >
                    <Icon className="w-8 h-8 text-white" strokeWidth={1.5} aria-hidden="true" />
                    <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-jade-600 border border-jade-400/40 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-jade-600/40">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-medium text-white mt-6">{item.title}</h3>
                  <p className="text-sm text-white/50 mt-2 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}