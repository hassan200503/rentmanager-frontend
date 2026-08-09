"use client";

import { useQuery } from "@tanstack/react-query";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { TrustBar } from "./components/TrustBar";
import { ProblemSolutionSection } from "./components/ProblemSolutionSection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { FeaturedPropertiesSection } from "./components/FeaturedPropertiesSection";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { CityGridSection } from "./components/CityGridSection";
import { StatsSection } from "./components/StatsSection";
import { WhyRentManagerSection } from "./components/WhyRentManagerSection";
import { DashboardPreviewSection } from "./components/DashboardPreviewSection";
import { PricingSection } from "./components/PricingSection";
import { FAQSection } from "./components/FAQSection";
import { FinalCTASection } from "./components/FinalCTASection";
import { Footer } from "./components/Footer";
import { CITIES } from "./data/content";
import { publicPropertyApi } from "@/features/public-listings/api/public-property-api";
import { publicUnitApi } from "@/features/public-listings/api/public-unit-api";

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

  const totalProperties = propertiesQuery.data?.totalElements ?? 0;
  const totalUnits = unitsQuery.data?.totalElements ?? 0;

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
        <ProblemSolutionSection />
        <HowItWorksSection />
        <FeaturedPropertiesSection
          isLoading={propertiesQuery.isLoading}
          isError={propertiesQuery.isError}
          properties={propertiesQuery.data?.content ?? []}
          onRetry={() => void propertiesQuery.refetch()}
        />
        <TestimonialsSection />
        <CityGridSection />
        <StatsSection totalProperties={totalProperties} totalUnits={totalUnits} cityCount={CITIES.length} />
        <WhyRentManagerSection />
        <DashboardPreviewSection />
        <PricingSection />
        <FAQSection />
      </main>
      <FinalCTASection />
      <Footer />
    </div>
  );
}