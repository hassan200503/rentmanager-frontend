"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Wallet, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRentLedgerSummaryQuery } from "@/features/rentledger/hooks/use-rent-ledger-summary";
import { formatCurrency } from "@/shared/utils/money";

/**
 * The landlord's money, at a glance.
 *
 * <h2>What this replaced</h2>
 * Six cards built from a hard-coded constant array. The component took no
 * props and read nothing: "Monthly Revenue" was the literal string
 * {@code "KES 0"} carrying {@code trend: {value: 12, positive: true}}, so it
 * rendered a green "+12%" beside a zero on every landlord's dashboard,
 * forever. "Cash Flow" carried a fabricated +5%. "M-Pesa Success Rate" and
 * "Collection Efficiency" were em-dashes that never resolved.
 *
 * <h2>Three cards, not six</h2>
 * There was no financial aggregate in the API at all, so the six were
 * decoration. {@code GET /rent-ledger/summary} was built to answer the
 * questions a landlord actually opens this page for, and it answers three of
 * them honestly. The other three are gone rather than reimagined:
 *
 *   M-Pesa success rate     — nothing tracks attempted-versus-succeeded STK
 *                             pushes as a ratio. Inventing one is how the
 *                             original got here.
 *   Collection efficiency   — needs collected-against-expected for a period,
 *                             which requires a definition of "expected" that
 *                             survives a landlord auditing it. Not yet.
 *   Cash flow               — needs money out as well as in. Disbursements
 *                             exist; netting them into a single figure needs
 *                             a decision about timing that nobody has made.
 *
 * Three true numbers beat six where three are fiction: a landlord who checks
 * one figure against their M-Pesa statement and finds it invented stops
 * trusting the ledger too, and the ledger is the thing that is actually right.
 *
 * <h2>No trend arrows</h2>
 * A trend needs a prior period to compare against. Until the API returns one,
 * there is nothing to draw.
 */

type Card = {
    icon: typeof Wallet;
    label: string;
    value: string;
    subtitle: string;
    color: string;
    bg: string;
    href?: string;
    emphasis?: boolean;
};

function SkeletonCard() {
    return (
        <div className="card h-[7.5rem] animate-pulse bg-border-subtle/40 dark:bg-border-subtle-dark/30" />
    );
}

export default function FinancialOverview() {
    const { data, isLoading, isError, refetch } = useRentLedgerSummaryQuery();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        );
    }

    // No figures rather than zeroes. A dashboard that renders "KES 0
    // outstanding" during an outage tells a landlord they have collected
    // everything, which is worse than telling them nothing.
    if (isError || !data) {
        return (
            <div className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-fg dark:text-fg-dark">
                        Could not load your figures
                    </p>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                        Your rent records are safe — this is only the summary.
                    </p>
                </div>
                <button type="button" onClick={() => void refetch()} className="btn-secondary text-sm">
                    Try again
                </button>
            </div>
        );
    }

    const currency = data.currency;
    const overdueCount = data.overdueEntryCount;

    const cards: Card[] = [
        {
            icon: TrendingUp,
            label: "Collected this month",
            value: formatCurrency(data.collectedThisMonth, { currency }),
            subtitle: "Payments received against this month's rent",
            color: "var(--color-success)",
            bg: "var(--color-success-bg)",
        },
        {
            icon: Wallet,
            label: "Outstanding",
            value: formatCurrency(data.outstandingTotal, { currency }),
            subtitle: "Still owed across every unpaid charge",
            color: "var(--color-brand)",
            bg: "var(--color-brand-50)",
            href: "/dashboard/rent-ledger",
        },
        {
            icon: AlertTriangle,
            label: "Overdue",
            value: formatCurrency(data.overdueTotal, { currency }),
            subtitle:
                overdueCount === 0
                    ? "Nothing past its due date"
                    : `Across ${overdueCount} charge${overdueCount === 1 ? "" : "s"}`,
            color: "var(--color-danger)",
            bg: "var(--color-danger-bg)",
            href: "/dashboard/rent-ledger",
            emphasis: overdueCount > 0,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card, i) => {
                const body = (
                    <>
                        <div className="flex items-start justify-between gap-3">
                            <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                style={{ background: card.bg, color: card.color }}
                            >
                                <card.icon className="h-4.5 w-4.5" strokeWidth={1.9} aria-hidden="true" />
                            </div>
                            {card.href && (
                                <ArrowRight
                                    className="h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark transition-transform group-hover:translate-x-0.5"
                                    strokeWidth={2}
                                    aria-hidden="true"
                                />
                            )}
                        </div>

                        <p className="mt-3 text-xs font-medium text-fg-muted dark:text-fg-muted-dark">
                            {card.label}
                        </p>
                        <p
                            className="font-data text-xl font-bold tracking-tight text-fg dark:text-fg-dark"
                            style={card.emphasis ? { color: card.color } : undefined}
                        >
                            {card.value}
                        </p>
                        <p className="mt-0.5 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                            {card.subtitle}
                        </p>
                    </>
                );

                return (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: i * 0.05 }}
                        className="card group"
                    >
                        {card.href ? (
                            <Link
                                href={card.href}
                                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg"
                            >
                                {body}
                            </Link>
                        ) : (
                            body
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
