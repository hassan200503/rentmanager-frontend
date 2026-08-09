import { LandingPage } from "@/features/landing/LandingPage";
import { FAQ_ITEMS } from "@/features/landing/data/content";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "RentManager",
      url: "/",
      description:
        "Kenya's rental platform for finding and reserving verified properties with refundable deposits and digital leases.",
      inLanguage: "en-KE",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "/listings?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      name: "RentManager",
      url: "/",
      logo: "/favicon.svg",
      description:
        "Verified listings, secure deposits, and digital leases for the Kenyan rental market.",
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer.replace(/<[^>]*>/g, ""),
        },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <LandingPage />
    </>
  );
}