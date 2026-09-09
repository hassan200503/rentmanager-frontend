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
import { SIGNUP_LANDLORD_HREF } from "@/lib/auth/signup-links";

export const STEP_ITEMS = [
  {
    step: "01",
    title: "Browse",
    desc: "Explore available units across Kenya. Filter by location, price, or property type.",
    icon: Search,
    color: "from-blue-500/30 to-blue-600/10",
  },
  {
    step: "02",
    title: "Reserve",
    desc: "Pay the deposit by M-Pesa to hold your unit. Terms are set by the landlord and shown before you pay.",
    icon: ShieldCheck,
    color: "from-jade-500/30 to-jade-600/10",
  },
  {
    step: "03",
    title: "Get your lease",
    desc: "Review your lease terms online and download a copy. Both sides keep the same document.",
    icon: FileText,
    color: "from-violet-500/30 to-violet-600/10",
  },
  {
    step: "04",
    title: "Move in",
    desc: "Your lease activates and rent starts running. Reminders and receipts are handled for you.",
    icon: Key,
    color: "from-amber-500/30 to-amber-600/10",
  },
];

export const FEATURES = [
  {
    title: "M-Pesa rent collection",
    desc: "Rent is paid by M-Pesa and matched to the right unit automatically. Anything the system cannot match with certainty goes to a review queue instead of being guessed at.",
    icon: Smartphone,
  },
  {
    title: "A ledger you can audit",
    desc: "Every charge, payment, adjustment and refund is a dated line against the lease. You can always answer what was owed, what was paid, and what settled it.",
    icon: CheckCircle2,
  },
  {
    title: "Instant receipts",
    desc: "A receipt is generated the moment a payment lands, and both landlord and tenant can download it.",
    icon: FileText,
  },
  {
    title: "Deposits recorded properly",
    desc: "Deposits are paid by M-Pesa and recorded against the lease as soon as they land, with a receipt for both sides and the balance visible to both.",
    icon: Lock,
  },
  {
    title: "Reviews from real tenants",
    desc: "Only someone who holds or has held a lease with a landlord can review them, and only once. No anonymous ratings, no bought reviews.",
    icon: ShieldCheck,
  },
  {
    title: "Support that answers",
    desc: "A real support address and phone number, published on every account. Weekday business hours, East Africa Time.",
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

/**
 * Static marketing copy. PRICES ARE NOT OWNED HERE — the backend plan
 * catalog (subscription_plans) is the single source of truth and the
 * pricing section reads it live. The landlord entries below exist only as
 * the shape the renter card and the offline fallback share; keep their
 * numbers in step with the seeded catalog (V50: STARTER 2,500 /
 * GROWTH 5,500 / PORTFOLIO 9,500) so a visitor never sees a price we
 * would not charge.
 */
export const PRICING_PLANS = [
  {
    name: "Renter",
    tagline: "For tenants and renters",
    price: "Free",
    period: "forever",
    highlight: false,
    cta: { label: "Start searching", href: "/listings" },
    features: [
      "Browse available listings nationwide",
      "Reserve a unit with an M-Pesa deposit",
      "See your rent balance and history any time",
      "Download every receipt",
      "Pay rent by M-Pesa from your phone",
    ],
  },
  {
    name: "Starter",
    tagline: "For single properties and small portfolios",
    price: "KES 2,500",
    period: "per month",
    highlight: true,
    cta: { label: "Create your account", href: SIGNUP_LANDLORD_HREF },
    features: [
      "Up to 10 units",
      "M-Pesa rent collection with automatic reconciliation",
      "Automatic rent charges, invoices and receipts",
      "A full tenant ledger for every lease",
      "Rent reminders by SMS and email",
      "Renter portal and maintenance requests",
    ],
  },
  {
    name: "Growth",
    tagline: "For portfolios that need less chasing",
    price: "KES 5,500",
    period: "per month",
    highlight: false,
    cta: { label: "Create your account", href: SIGNUP_LANDLORD_HREF },
    features: [
      "Everything in Starter, up to 30 units",
      "Arrears tracking and overdue escalation",
      "Maintenance workflow with response-time tracking",
      "Announcements to all tenants (in-app, SMS, email)",
      "Auto-pay for tenants who opt in",
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
      "Up to 10 units",
      "M-Pesa rent collection with automatic reconciliation",
      "Automatic rent charges, invoices and receipts",
      "A full tenant ledger for every lease",
      "Rent reminders by SMS and email",
      "Renter portal and maintenance requests",
    ],
  },
  GROWTH: {
    tagline: "For portfolios that need less chasing",
    features: [
      "Everything in Starter, up to 30 units",
      "Arrears tracking and overdue escalation",
      "Maintenance workflow with response-time tracking",
      "Announcements to all tenants (in-app, SMS, email)",
      "Auto-pay for tenants who opt in",
    ],
  },
  PORTFOLIO: {
    tagline: "For full-time landlords and managers",
    features: [
      "Everything in Growth, up to 75 units",
      "Your own M-Pesa Paybill connected directly",
      "Your branding on receipts and lease documents",
      "Disbursement tracking with retry and manual review",
      "Verified tenant reviews on your listings",
    ],
  },
  ENTERPRISE: {
    tagline: "For property managers and large portfolios",
    features: [
      "Everything in Portfolio, 75+ units",
      "Dedicated account manager",
      "Custom integrations and API access",
      "White-label branding on all documents",
      "Priority response SLA",
    ],
  },
};

/**
 * Offline/error fallback for the landlord cards. These MUST match the
 * seeded catalog in V50 — a visitor who lands while the plans API is down
 * still has to see the price we will actually charge.
 */
export const FALLBACK_LANDLORD_PLANS = [
  {
    code: "STARTER",
    name: "Starter",
    monthlyPrice: 2500,
    maxUnits: 10 as number | null,
  },
  {
    code: "GROWTH",
    name: "Growth",
    monthlyPrice: 5500,
    maxUnits: 30 as number | null,
  },
  {
    code: "PORTFOLIO",
    name: "Portfolio",
    monthlyPrice: 9500,
    maxUnits: 75 as number | null,
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "What happens to my deposit?",
    answer:
      "Your deposit is paid by M-Pesa and recorded against your lease the moment it lands, and you get a receipt straight away. It is held by your landlord, not by RentManager, and the conditions for returning it are the ones written into your lease — read them before you pay. RentManager keeps the record of what you paid and when, so there is no argument later about whether you paid.",
  },
  {
    question: "How do M-Pesa payments work?",
    answer:
      "You pay by M-Pesa from your phone. The payment is matched to your unit and applied to your rent balance automatically, and a receipt is generated immediately. If a payment cannot be matched with certainty — a mistyped account number, for example — it goes to a review queue for a person to resolve rather than being credited to the wrong tenant.",
  },
  {
    question: "Who can review a landlord?",
    answer:
      "Only a tenant who holds, or has held, a lease with that landlord, and only once. Reviews are tied to a real lease record, so they cannot be bought, faked, or posted by someone who never lived there.",
  },
  {
    question: "Is my lease document legally binding?",
    answer:
      "The lease terms you agree are recorded in the system and both parties can download the same document at any time. Whether a particular agreement is enforceable depends on Kenyan law and on what you and your landlord signed — RentManager keeps the record, it does not give legal advice.",
  },
  {
    question: "What does it cost?",
    answer:
      "Renters pay nothing to use RentManager. Landlords pay a monthly subscription based on how many units they manage — the current prices are shown above and are the prices you will be charged.",
  },
  {
    question: "What happens to my data?",
    answer:
      "Your records — leases, payments, receipts, maintenance history — stay yours and remain exportable. Payment details are handled by M-Pesa; RentManager stores the transaction reference, not your PIN or your M-Pesa credentials.",
  },
] as const;

export const STAT_FEATURES = [
  { icon: Smartphone, label: "M-Pesa rent collection" },
  { icon: CheckCircle2, label: "Auditable tenant ledger" },
  { icon: FileText, label: "Instant digital receipts" },
  { icon: ShieldCheck, label: "Reviews from verified tenants" },
] as const;
