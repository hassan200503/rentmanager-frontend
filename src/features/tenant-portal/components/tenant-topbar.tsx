// components/tenant-topbar.tsx
"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Menu, HelpCircle, Sun, Moon, Wallet } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useTenantDashboardQuery } from "../hooks/use-tenant-portal-queries";
import { formatCurrency } from "./tenant-dashboard";

const PAGE_TITLES: Record<string, string> = {
    "/portal": "Dashboard",
    "/portal/payments": "Payments",
    "/portal/lease": "Lease",
    "/portal/landlord": "Landlord",
    "/portal/maintenance": "Maintenance",
    "/portal/payment-success": "Payment Receipt",
};

export default function TenantTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const { data } = useTenantDashboardQuery();

    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );

    const pageTitle = PAGE_TITLES[pathname ?? ""] ?? "Tenant Portal";
    const unitContext = data?.unitNumber
        ? `Unit ${data.unitNumber}${data?.propertyName ? ` · ${data.propertyName}` : ""}`
        : (data?.propertyName ?? "Your rental home");

    const balance = data?.currentBalance ?? 0;
    const overdue = data?.overdueAmount ?? 0;
    const balanceLabel = overdue > 0 ? "Overdue" : "Balance";
    const balanceValue = overdue > 0 ? overdue : Math.max(0, balance);
    const balanceTone =
        overdue > 0
            ? "text-danger dark:text-danger"
            : balance > 0
                ? "text-warning-dark dark:text-warning"
                : "text-success-dark dark:text-success";

    return (
        <header className="h-14 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-border/60 dark:border-border-dark/60 flex items-center justify-between px-3 sm:px-5 sticky top-0 z-30">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <button
                    type="button"
                    onClick={onOpenMenu}
                    aria-label="Open menu"
                    className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-fg-muted dark:text-fg-muted-dark shadow-card"
                >
                    <Menu className="h-4 w-4" strokeWidth={2} />
                </button>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="font-display text-sm sm:text-base font-semibold text-fg dark:text-fg-dark truncate">
                            {pageTitle}
                        </h1>
                        {data?.leaseStatus && (
                            <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 px-1.5 py-0.5 rounded-md border border-brand-200 dark:border-brand-700">
                                <span className="status-dot-success status-dot-live" />
                                {data.leaseStatus.toLowerCase()}
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark truncate hidden sm:block">{unitContext}</p>
                </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Balance chip */}
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-border-subtle/50 dark:bg-border-subtle-dark/50 text-xs">
                    <Wallet className="h-3.5 w-3.5 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                    <span className="text-fg-muted dark:text-fg-muted-dark">{balanceLabel}</span>
                    <span className={`font-data font-semibold tabular-nums ${balanceTone}`}>{formatCurrency(balanceValue)}</span>
                </div>

                <button
                    type="button"
                    aria-label="Help"
                    className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-all duration-150"
                >
                    <HelpCircle className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.75} />
                </button>

                <button
                    type="button"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label="Toggle theme"
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-all duration-150"
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
