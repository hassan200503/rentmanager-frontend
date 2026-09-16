"use client";

import Link from "next/link";
import { ArrowRight, Building2, Home } from "lucide-react";
import { SIGNUP_LANDLORD_HREF, SIGNUP_RENTER_HREF } from "@/lib/auth/signup-links";
import { SIGNIN_HREF } from "@/lib/auth/signin-links";

/**
 * The fork in the road, placed high on the page.
 *
 * <h2>Why this section exists</h2>
 * The landing page carries content for two completely different audiences —
 * featured properties and "how it works" speak to renters, while pricing and
 * the dashboard preview speak to landlords — but every sign-up call to action
 * on it was {@code intent=landlord}. A renter could scroll past homes for rent
 * and find that every button asked them to list a property.
 *
 * <h2>Why only two paths</h2>
 * There are three personas in the system; the third is the platform admin, and
 * it is deliberately absent here. Advertising an administrative entrance tells
 * an attacker where to aim, and nobody arrives at a marketing page intending
 * to become platform staff. Admins reach {@code /admin} because their verified
 * claims send them there, never because a link invited them.
 *
 * <h2>Intent is a hint, not a permission</h2>
 * The sign-up links carry {@code intent=renter} / {@code intent=landlord} so
 * a new account is taken to the right first step (the renter portal, or
 * organisation setup). Sign-in carries no intent at all: everyone signs in the
 * same way and /continue routes from what the API says the account is.
 */

type Path = {
    icon: typeof Home;
    eyebrow: string;
    title: string;
    body: string;
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
    accent: string;
};

const PATHS: readonly Path[] = [
    {
        icon: Home,
        eyebrow: "For renters",
        title: "Looking for a home",
        body: "Browse listed homes, reserve a unit, and pay rent from your phone. Every payment is receipted and kept on a record you can check any time.",
        primary: { label: "Browse homes", href: "/listings" },
        secondary: { label: "Create a renter account", href: SIGNUP_RENTER_HREF },
        accent: "jade",
    },
    {
        icon: Building2,
        eyebrow: "For landlords and agents",
        title: "Managing property",
        body: "List your units, collect rent over M-Pesa, and see exactly what was paid and what is owed — without chasing anyone for a receipt.",
        primary: { label: "List your property", href: SIGNUP_LANDLORD_HREF },
        secondary: { label: "See pricing", href: "#pricing" },
        accent: "amber",
    },
];

export function AudiencePathsSection() {
    return (
        <section
            id="get-started"
            aria-labelledby="audience-paths-heading"
            className="relative py-20 md:py-28"
        >
            <div className="max-w-5xl mx-auto px-6">
                <h2
                    id="audience-paths-heading"
                    className="text-center text-2xl md:text-3xl font-semibold tracking-tight text-white"
                >
                    Which brings you here?
                </h2>
                <p className="mt-3 text-center text-sm md:text-base text-white/60 max-w-xl mx-auto">
                    Two ways in. Pick the one that sounds like you — you can always switch later.
                </p>

                <div className="mt-10 grid gap-4 md:grid-cols-2">
                    {PATHS.map((path) => (
                        <div
                            key={path.eyebrow}
                            className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-7 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                        >
                            <div
                                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                                    path.accent === "jade"
                                        ? "bg-jade-500/10 text-jade-400 ring-1 ring-jade-500/20"
                                        : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                                }`}
                            >
                                <path.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                            </div>

                            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                                {path.eyebrow}
                            </p>
                            <h3 className="mt-1.5 text-xl font-semibold text-white">{path.title}</h3>
                            <p className="mt-2.5 text-sm leading-relaxed text-white/60 flex-1">
                                {path.body}
                            </p>

                            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                                <Link
                                    href={path.primary.href}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712] ${
                                        path.accent === "jade"
                                            ? "bg-jade-500 text-[#04140e] hover:bg-jade-400 focus-visible:ring-jade-400"
                                            : "bg-white text-[#0b1220] hover:bg-white/90 focus-visible:ring-white"
                                    }`}
                                >
                                    {path.primary.label}
                                    <ArrowRight
                                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                        strokeWidth={2}
                                        aria-hidden="true"
                                    />
                                </Link>

                                <Link
                                    href={path.secondary.href}
                                    className="text-sm font-medium text-white/60 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
                                >
                                    {path.secondary.label}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="mt-8 text-center text-sm text-white/45">
                    Already have an account?{" "}
                    <Link
                        href={SIGNIN_HREF}
                        className="text-white/70 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
                    >
                        Sign in
                    </Link>
                    .
                </p>
            </div>
        </section>
    );
}
