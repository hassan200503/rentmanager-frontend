"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { TrustBar } from "./components/TrustBar";
import { AudiencePathsSection } from "./components/AudiencePathsSection";
import { ProblemSolutionSection } from "./components/ProblemSolutionSection";
import { FeaturedPropertiesSection } from "./components/FeaturedPropertiesSection";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { StatsSection } from "./components/StatsSection";
import { WhyRentManagerSection } from "./components/WhyRentManagerSection";
import { Premium3DDashboardSection } from "./components/Premium3DDashboardSection";
import { PricingSection } from "./components/PricingSection";
import { FAQSection } from "./components/FAQSection";
import { FinalCTASection } from "./components/FinalCTASection";
import { Footer } from "./components/Footer";
import { CITIES } from "./data/content";
import { publicPropertyApi } from "@/features/public-listings/api/public-property-api";
import { publicUnitApi } from "@/features/public-listings/api/public-unit-api";

/**
 * Three.js scene, client-only and genuinely deferred.
 *
 * The previous comment here said "lazy-load on scroll", but next/dynamic
 * fetches the chunk as soon as the component mounts, and this component was
 * rendered unconditionally — so three, @react-three/fiber and gsap were all
 * downloaded at scrollY 0, before the visitor had scrolled a pixel. Measured
 * in the browser that was ~670 KB of a ~1.1 MB page, for a decorative map
 * most visitors never reach.
 *
 * The buyer here is on a mid-range Android phone paying for data by the
 * megabyte, so that is their money, not ours. Deferred() below now holds the
 * import back until the section is actually near the viewport.
 */
/**
 * gsap + ScrollTrigger deferred the same way the three.js map is.
 * The module-scope gsap.registerPlugin() in HowItWorksSection runs as a
 * side-effect at bundle parse time when statically imported, pulling ~107 KB
 * into the initial chunk. dynamic() + DeferUntilNearViewport hold the fetch
 * until the section is 400px from the viewport — the animation is unaffected
 * because the chunk arrives before the user scrolls that far.
 */
const HowItWorksSection = dynamic(
  () =>
    import("./components/HowItWorksSection").then(
      (m) => m.HowItWorksSection
    ),
  {
    ssr: false,
    loading: () => <HowItWorksPlaceholder />,
  }
);

function HowItWorksPlaceholder() {
  return <section className="relative py-24 md:py-32" aria-hidden="true" />;
}

const Premium3DKenyaMapSection = dynamic(
  () =>
    import("./components/Premium3DKenyaMapSection").then(
      (m) => m.Premium3DKenyaMapSection
    ),
  {
    ssr: false,
    loading: () => <MapPlaceholder />,
  }
);

/**
 * Shown both before the chunk is requested and while it downloads, so the
 * section reserves its space and the page does not shift when the scene
 * arrives.
 */
function MapPlaceholder() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="aspect-square rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse skeleton-3d" />
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-16 rounded-lg skeleton-3d" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Renders children only once the placeholder has come near the viewport.
 *
 * Mounting the child is what triggers next/dynamic to fetch its chunk, so
 * gating the mount is what actually defers the download — gating the
 * animation, which useShouldAnimate already does well, does not.
 *
 * `rootMargin` starts the fetch slightly before the section is visible so the
 * scene is ready by the time it is scrolled to, rather than popping in late.
 * `save-data` skips it entirely: a visitor who has explicitly asked their
 * browser to conserve data should not be spending it on scenery.
 */
function DeferUntilNearViewport({
  children,
  placeholder,
}: {
  children: React.ReactNode;
  placeholder: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const saveData =
      (navigator as { connection?: { saveData?: boolean } }).connection?.saveData === true;
    if (saveData) return;

    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShow(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{show ? children : placeholder}</div>;
}

export function LandingPage() {
  const propertiesQuery = useQuery({
    queryKey: ["public-properties", "landing"],
    queryFn: () => publicPropertyApi.list({ page: 0, size: 8 }),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const unitsQuery = useQuery({
    queryKey: ["public-units", "landing"],
    queryFn: () => publicUnitApi.list({ page: 0, size: 1 }),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // null, not 0: "we do not know yet" and "there are none" are different
  // facts, and collapsing them is what let the hero render a confident "1"
  // and the stats grid a confident "0" during the same API failure.
  const totalProperties = propertiesQuery.data?.totalElements ?? null;
  const totalUnits = unitsQuery.data?.totalElements ?? null;

  return (
    <div className="landing-root min-h-screen bg-[#030712] text-white antialiased">
      <Navbar />
      <main id="main-content">
        <HeroSection
          totalProperties={totalProperties}
          totalUnits={totalUnits}
          cityCount={CITIES.length}
        />
        <TrustBar />
        <AudiencePathsSection />
        <ProblemSolutionSection />
        <DeferUntilNearViewport placeholder={<HowItWorksPlaceholder />}>
          <HowItWorksSection />
        </DeferUntilNearViewport>
        <FeaturedPropertiesSection
          isLoading={propertiesQuery.isLoading}
          isError={propertiesQuery.isError}
          properties={propertiesQuery.data?.content ?? []}
          onRetry={() => void propertiesQuery.refetch()}
        />
        <TestimonialsSection />
        <DeferUntilNearViewport placeholder={<MapPlaceholder />}>
          <Premium3DKenyaMapSection
            verifiedCount={unitsQuery.data?.totalElements}
            verifiedCountUpdatedAt={
              unitsQuery.dataUpdatedAt
                ? new Date(unitsQuery.dataUpdatedAt).toISOString()
                : undefined
            }
            verifiedCountError={unitsQuery.isError}
          />
        </DeferUntilNearViewport>
        <StatsSection totalProperties={totalProperties} totalUnits={totalUnits} cityCount={CITIES.length} />
        <WhyRentManagerSection />
        <Premium3DDashboardSection />
        <PricingSection />
        <FAQSection />
      </main>
      <FinalCTASection />
      <Footer />
    </div>
  );
}