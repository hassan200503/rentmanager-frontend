import {
  Search,
  ShieldCheck,
  FileText,
  Key,
  CheckCircle2,
  Smartphone,
  HeadphonesIcon,
  Lock,
} from "lucide-react";

export const STEP_ITEMS = [
  {
    step: "01",
    title: "Browse",
    desc: "Explore verified vacancies across Kenya. Filter by location, price, or property type.",
    icon: Search,
    color: "from-blue-500/30 to-blue-600/10",
  },
  {
    step: "02",
    title: "Reserve",
    desc: "Pay a small, fully refundable deposit to secure your unit instantly.",
    icon: ShieldCheck,
    color: "from-jade-500/30 to-jade-600/10",
  },
  {
    step: "03",
    title: "Sign Lease",
    desc: "Review and sign your digital lease agreement online. No paperwork.",
    icon: FileText,
    color: "from-violet-500/30 to-violet-600/10",
  },
  {
    step: "04",
    title: "Move In",
    desc: "Your lease activates automatically. Rent reminders and receipts handled for you.",
    icon: Key,
    color: "from-amber-500/30 to-amber-600/10",
  },
];

export const FEATURES = [
  {
    title: "Verified Owners",
    desc: "Every owner is ID-checked before their property goes live. Fake listings never make it onto the platform.",
    icon: ShieldCheck,
  },
  {
    title: "Secure Deposits",
    desc: "Deposits are held in escrow until move-in is confirmed by both parties — then refunded instantly if a listing falls through.",
    icon: Lock,
  },
  {
    title: "Digital Leases",
    desc: "Sign a legally binding lease from your phone. No trips, no paperwork, no waiting on a landlord.",
    icon: FileText,
  },
  {
    title: "Instant Receipts",
    desc: "Every payment generates a digital receipt the moment it lands. Track everything from one place.",
    icon: CheckCircle2,
  },
  {
    title: "M-Pesa Built In",
    desc: "Pay rent in seconds from your phone. Automatic reconciliation and payment reminders for landlords.",
    icon: Smartphone,
  },
  {
    title: "24/7 Support",
    desc: "A real team, around the clock. Questions about deposits, leases, or payments answered fast.",
    icon: HeadphonesIcon,
  },
] as const;

export const CITIES = [
  {
    name: "Nairobi",
    desc: "Capital city · 4M+ residents",
    gradient: "from-jade-950/90 via-jade-900/40 to-[#030712]/95",
    objectPosition: "center 30%",
    span: "md:col-span-2 md:row-span-2",
  },
  {
    name: "Mombasa",
    desc: "Coastal metropolis",
    gradient: "from-cyan-950/90 via-cyan-900/40 to-[#030712]/95",
    objectPosition: "center 50%",
    span: "",
  },
  {
    name: "Kisumu",
    desc: "Lakeside city",
    gradient: "from-teal-950/90 via-teal-900/40 to-[#030712]/95",
    objectPosition: "center 50%",
    span: "",
  },
  {
    name: "Nakuru",
    desc: "Rift Valley hub",
    gradient: "from-amber-950/90 via-amber-900/40 to-[#030712]/95",
    objectPosition: "center 60%",
    span: "",
  },
  {
    name: "Eldoret",
    desc: "North Rift economic center",
    gradient: "from-violet-950/90 via-violet-900/40 to-[#030712]/95",
    objectPosition: "center 40%",
    span: "",
  },
] as const;

export const PRICING_PLANS = [
  {
    name: "Renter",
    tagline: "For tenants and renters",
    price: "Free",
    period: "forever",
    highlight: false,
    cta: { label: "Start searching", href: "/listings" },
    features: [
      "Browse verified listings nationwide",
      "Reserve with a refundable deposit",
      "Digital lease signing",
      "Automatic rent receipts",
      "M-Pesa rent payments",
    ],
  },
  {
    name: "Landlord Standard",
    tagline: "For single properties and small portfolios",
    price: "KES 999",
    period: "per month",
    highlight: true,
    cta: { label: "Start free trial", href: "/public/sign-up?intent=landlord" },
    features: [
      "Unlimited property listings",
      "M-Pesa rent collection & reminders",
      "Digital lease agreements",
      "Tenant & occupancy tracking",
      "eTIMS-ready digital receipts",
      "Landlord dashboard",
    ],
  },
  {
    name: "Landlord Pro",
    tagline: "For portfolios that run themselves",
    price: "KES 2,499",
    period: "per month",
    highlight: false,
    cta: { label: "Go Pro", href: "/public/sign-up?intent=landlord" },
    features: [
      "Everything in Standard",
      "Maintenance request management",
      "Revenue & occupancy insights",
      "Late payment automation",
      "Priority 24/7 support",
    ],
  },
] as const;

/**
 * Static copy keyed by the backend plan code (the platform pricing catalog
 * owns prices + names; features/taglines live here because the catalog has
 * no features column). Anything unlisted degrades to a safe generic tier.
 */
export const LANDLORD_PLAN_META: Record<
  string,
  { tagline: string; features: string[] }
> = {
  STARTER: {
    tagline: "For single properties and small portfolios",
    features: [
      "Unlimited property listings",
      "M-Pesa rent collection & reminders",
      "Digital lease agreements",
      "Tenant & occupancy tracking",
      "eTIMS-ready digital receipts",
      "Landlord dashboard",
    ],
  },
  GROWTH: {
    tagline: "For portfolios that run themselves",
    features: [
      "Everything in Starter",
      "Maintenance request management",
      "Revenue & occupancy insights",
      "Late payment automation",
      "Priority 24/7 support",
    ],
  },
  PORTFOLIO: {
    tagline: "For full-time professional landlords",
    features: [
      "Everything in Growth",
      "Multi-property portfolio analytics",
      "Dedicated account manager",
      "Custom branding on leases & receipts",
      "Concierge move-in support",
    ],
  },
};

/** Offline/error fallback for the landlord cards (never shows stale claims). */
export const FALLBACK_LANDLORD_PLANS = [
  {
    code: "STARTER",
    name: "Landlord Standard",
    monthlyPrice: 999,
    maxUnits: null as number | null,
  },
  {
    code: "GROWTH",
    name: "Landlord Pro",
    monthlyPrice: 2499,
    maxUnits: null as number | null,
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "Is my deposit really refundable?",
    answer:
      "Yes. Deposits are held securely and refunded in full if the unit is unavailable, the landlord withdraws, or — after move-in — once both parties confirm occupancy. You never pay a reservation fee to a middleman.",
  },
  {
    question: "How are listings verified?",
    answer:
      "Every property owner is ID-verified before their listing goes live, and each vacancy is checked by our team. We remove any listing that fails verification within hours — not weeks.",
  },
  {
    question: "How do M-Pesa payments work?",
    answer:
      "Rent and deposits are paid directly through M-Pesa into a secure account. Payments reconcile automatically, and you get a digital receipt instantly — no chasing landlords for confirmation.",
  },
  {
    question: "Are digital leases legally binding?",
    answer:
      "Yes. Digital leases on RentManager are signed with e-signature and timestamped, in line with Kenya&apos;s e-transactions law. Both parties keep an accessible, permanent copy.",
  },
  {
    question: "Are there any broker fees?",
    answer:
      "None. RentManager removes the broker from the equation. Renters pay only their deposit and rent; landlords pay one transparent subscription for the tools, not a cut per tenant.",
  },
  {
    question: "How fast can I move in?",
    answer:
      "Most renters go from search to signed lease in under 48 hours. The average search-to-lease time on the platform is 3 days — versus the weeks it takes with agents and paperwork.",
  },
] as const;

export const STAT_FEATURES = [
  { icon: ShieldCheck, label: "ID-verified owners" },
  { icon: Lock, label: "Encrypted M-Pesa payments" },
  { icon: FileText, label: "Legally binding leases" },
  { icon: HeadphonesIcon, label: "24/7 human support" },
] as const;