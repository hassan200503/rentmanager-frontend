import { LandingPage } from "@/features/landing/LandingPage";
import { FAQ_ITEMS } from "@/features/landing/data/content";
import type { Metadata } from "next";
import { appConfig } from "@/lib/config/app-config";

/**
 * Structured data requires absolute URLs — schema.org consumers resolve
 * `url` and `logo` as identifiers, and a relative "/" identifies nothing.
 * These were relative, so search engines had no stable entity to attach the
 * organisation and FAQ markup to.
 *
 * Falls back to the production origin when NEXT_PUBLIC_APP_URL is unset, so a
 * misconfigured deploy emits a wrong-but-absolute URL rather than invalid
 * markup. The trailing slash is stripped so paths join cleanly.
 */
const SITE_URL = appConfig.siteUrl;

/**
 * Page-level metadata.
 *
 * The layout default describes the product to landlords — "collect rent,
 * issue eTIMS-ready receipts, stay KRA compliant" — which is right for the
 * dashboard but wrong for the one page that has to speak to renters and
 * landlords at once. A searcher looking for a home should not read a
 * compliance pitch in the result snippet.
 *
 * The canonical is explicit because this page is reachable at "/" with any
 * number of tracking or anchor parameters; without it those variants compete
 * with each other in the index.
 */
export const metadata: Metadata = {
  title: "Rent a home or manage property in Kenya",
  description:
    "Find a home from an approved landlord, reserve it online, and pay rent by M-Pesa with a receipt every time. Landlords: list units and see exactly what was paid and what is owed.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "RentManager — rent a home or manage property in Kenya",
    description:
      "Homes from approved landlords, M-Pesa rent payments with receipts, and digital leases.",
    url: "/",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "RentManager",
      url: SITE_URL,
      description:
        "Kenya's rental platform for finding and reserving homes from approved landlords, with M-Pesa rent payments and digital leases.",
      inLanguage: "en-KE",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/listings?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      name: "RentManager",
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.svg`,
      description:
        "Homes from approved landlords, M-Pesa rent payments with receipts, and digital leases for the Kenyan rental market.",
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