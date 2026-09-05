// components/tenant-topbar.tsx
"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Menu, HelpCircle, Sun, Moon, Wallet } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useTenantDashboardQuery } from "../hooks/use-tenant-portal-queries";
import { formatCurrency, toMoneyNumber } from "@/shared/utils/money";

const PAGE_TITLES: Record<string, string> = {
    "/portal": "Dashboard",
    "/portal/payments": "Payments",
    "/portal/lease": "Lease",
    "/portal/landlord": "Landlord",
    "/portal/reviews": "Reviews",
    "/portal/maintenance": "Maintenance",
    "/portal/announcements": "Announcements",
    "/portal/help": "Help & Support",
    "/portal/payment-success": "Payment Receipt",
};

export default function TenantTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const { data, isLoading, isError } = useTenantDashboardQuery();

    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );

    const pageTitle = PAGE_TITLES[pathname ?? ""] ?? "Tenant Portal";

    // A money figure must never be synthesised from missing data. Previously
    // `toMoneyNumber(undefined)` collapsed to 0, so a failed or in-flight
    // dashboard query still rendered a confident "Balance Ksh 0" — a number the
    // app did not actually know, sitting next to "Unable to load dashboard".
    const hasBalance = Boolean(data) && !isError;
    const balance = toMoneyNumber(data?.currentBalance);
    const overdue = toMoneyNumber(data?.overdueAmount);
    const balanceLabel = overdue > 0 ? "Overdue" : "Balance";
    const balanceValue = overdue > 0 ? overdue : Math.max(0, balance);
    const balanceTone =
        overdue > 0
            ? "text-danger dark:text-danger"
            : balance > 0
                ? "text-warning-dark dark:text-warning"
                : "text-success-dark dark:text-success";

    return (
        <header className="tenant-topbar h-14 flex items-center justify-between px-3 sm:px-5 sticky top-0 z-30">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <button
                    type="button"
                    onClick={onOpenMenu}
                    aria-label="Open menu"
                    className="tenant-topbar-menu md:hidden flex h-9 w-9 shrink-0 items-center justify-center"
                >
                    <Menu className="h-4 w-4" strokeWidth={2} />
                </button>
                {/* Page title only. The unit/property line used to repeat here, but
                    the sidebar already anchors it persistently and the dashboard hero
                    features it — three copies of "Unit X · Property" on one screen
                    reads as a templating bug, not as polish. */}
                <div className="min-w-0 flex items-center gap-2">
                    {/* font-brand (Fraunces), not font-display (Instrument Serif) —
                        the latter is a thin display face meant for large hero type
                        and reads spindly at this size. See BrandBadge.tsx's
                        LIGHT_WORDMARK comment for the full reasoning. */}
                    <h1 className="font-brand text-sm sm:text-base font-semibold text-fg dark:text-fg-dark truncate">
                        {pageTitle}
                    </h1>
                    {data?.leaseStatus && (
                        <span className="tenant-status-chip tenant-status-chip-success hidden sm:inline-flex shrink-0">
                            <span className="status-dot-success status-dot-live" />
                            {data.leaseStatus.toLowerCase()}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Balance chip — shown only when a real figure is known.
                    While loading it holds its space with a shimmer so the topbar
                    does not reflow; on error it is omitted entirely rather than
                    inventing a zero. */}
                {hasBalance ? (
                    <div className="tenant-topbar-balance hidden sm:flex items-center gap-1.5 text-xs">
                        <Wallet className="h-3.5 w-3.5 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                        <span className="text-fg-muted dark:text-fg-muted-dark">{balanceLabel}</span>
                        <span className={`font-data font-semibold tabular-nums ${balanceTone}`}>{formatCurrency(balanceValue)}</span>
                    </div>
                ) : isLoading ? (
                    <div className="tenant-topbar-balance hidden sm:flex items-center gap-1.5">
                        <div className="tenant-skeleton-premium h-3 w-12 rounded" />
                        <div className="tenant-skeleton-premium h-3 w-14 rounded" />
                    </div>
                ) : null}

                <Link
                    href="/portal/help"
                    aria-label="Help & Support"
                    className="tenant-topbar-button hidden sm:flex h-8 w-8 items-center justify-center"
                >
                    <HelpCircle className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.75} />
                </Link>

                <button
                    type="button"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label="Toggle theme"
                    className="tenant-topbar-button flex h-8 w-8 items-center justify-center"
                >
                    {mounted && theme === "dark" ? (
                        <Sun className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.75} />
                    ) : (
                        <Moon className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.75} />
                    )}
                </button>

                <div className="h-4 w-px bg-border/60 dark:bg-border-dark/60" />

                <UserButton
                    appearance={{
                        elements: {
                            avatarBox: "w-7 h-7 ring-2 ring-border/50 dark:ring-border-dark/50 hover:ring-brand/30 transition-all duration-200",
                            userButtonPopoverCard: "shadow-dropdown border border-border dark:border-border-dark rounded-xl",
                        },
                    }}
                />
            </div>
        </header>
    );
}
