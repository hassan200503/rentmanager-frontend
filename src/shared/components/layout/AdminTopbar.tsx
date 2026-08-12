"use client";

import { UserButton } from "@clerk/nextjs";
import {
    ShieldCheck,
    Loader2,
    Search,
    Sun,
    Moon,
    Menu,
    ChevronRight,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useSyncExternalStore, useState } from "react";
import { usePlatformRole } from "@/features/admin/hooks/use-platform-role";
import { useAdminSettingsQuery } from "@/features/admin/hooks/use-admin-queries";
import AdminCommandPalette from "@/shared/components/command-palette/AdminCommandPalette";

const PAGE_CRUMBS: { prefix: string; label: string }[] = [
    { prefix: "/admin/landlords", label: "Landlords" },
    { prefix: "/admin/renters", label: "Renters" },
    { prefix: "/admin/properties", label: "Properties" },
    { prefix: "/admin/reviews", label: "Reviews" },
    { prefix: "/admin/disbursements", label: "Disbursements" },
    { prefix: "/admin/commission", label: "Commission policy" },
    { prefix: "/admin/settings", label: "Platform settings" },
];

function useBreadcrumb(pathname: string) {
    if (pathname === "/admin") return "Overview";
    const match = PAGE_CRUMBS.find((c) => pathname.startsWith(c.prefix));
    return match ? match.label : "Console";
}

/**
 * Top bar for the platform admin console — breadcrumb trail, live
 * environment state, ⌘K console search, theme toggle and the Clerk
 * account menu.
 */
export default function AdminTopbar({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
    const pathname = usePathname();
    const { role, isLoading: roleLoading, isDenied } = usePlatformRole();
    const { data: settings } = useAdminSettingsQuery();
    const { theme, setTheme } = useTheme();
    const [paletteOpen, setPaletteOpen] = useState(false);
    const hasMounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );

    const crumb = useBreadcrumb(pathname);
    const sandbox = settings?.platform.sandbox;
    const environment = settings?.platform.environment ?? null;

    return (
        <>
            <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-surface/80 px-4 backdrop-blur-xl dark:border-border-dark/60 dark:bg-surface-dark/80 sm:px-6">
                <div className="flex min-w-0 items-center gap-2.5">
                    <button
                        type="button"
                        onClick={onOpenSidebar}
                        aria-label="Open navigation"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-border-subtle dark:text-fg-muted-dark dark:hover:bg-border-subtle-dark lg:hidden"
                    >
                        <Menu className="h-4.5 w-4.5" strokeWidth={2} />
                    </button>

                    <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm shadow-brand-500/20 sm:flex">
                        <ShieldCheck className="h-4 w-4 text-white" strokeWidth={2} />
                    </div>

                    {/* Breadcrumb */}
                    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
                        <span className="hidden font-semibold text-fg dark:text-fg-dark md:inline">
                            Platform Admin Console
                        </span>
                        <span className="crumb-sep hidden md:inline">
                            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                        </span>
                        <span className="truncate font-medium text-fg-muted dark:text-fg-muted-dark">
                            {crumb}
                        </span>
                    </nav>

                    {roleLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                    ) : !isDenied && role ? (
                        <span className="pill-brand hidden shrink-0 sm:inline-flex">{role}</span>
                    ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {/* Environment pill */}
                    {environment && (
                        <span
                            title={sandbox
                                ? "M-Pesa traffic is routed to the Safaricom sandbox — no real money moves."
                                : "M-Pesa traffic is routed to the live Safaricom gateways."}
                            className={`hidden items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium md:flex ${
                                sandbox
                                    ? "border-warning/30 bg-warning/10 text-warning-dark dark:text-amber-300"
                                    : "border-success/30 bg-success/10 text-success-dark dark:text-success"
                            }`}
                        >
                            <span
                                className={`status-dot ${sandbox ? "status-dot-warning" : "status-dot-success"} status-dot-live`}
                            />
                            {environment}
                        </span>
                    )}

                    {/* Console search */}
                    <button
                        type="button"
                        onClick={() => setPaletteOpen(true)}
                        className="hidden h-8 items-center gap-2 rounded-lg border border-border bg-white px-2.5 text-[11px] font-medium text-fg-muted transition-colors hover:border-brand/30 hover:text-fg dark:border-border-dark dark:bg-surface-dark dark:text-fg-muted-dark dark:hover:text-fg-dark sm:flex"
                        aria-label="Search console (⌘K)"
                    >
                        <Search className="h-3.5 w-3.5" strokeWidth={2} />
                        <span className="hidden lg:inline">Search console…</span>
                        <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[9px] text-fg-subtle dark:border-border-dark dark:text-fg-subtle-dark">
                            ⌘K
                        </kbd>
                    </button>
                    <button
                        type="button"
                        onClick={() => setPaletteOpen(true)}
                        aria-label="Search console (⌘K)"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-fg-muted dark:border-border-dark dark:text-fg-muted-dark sm:hidden"
                    >
                        <Search className="h-4 w-4" strokeWidth={2} />
                    </button>

                    {/* Theme toggle */}
                    <button
                        type="button"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        aria-label="Toggle theme"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-border-subtle dark:text-fg-muted-dark dark:hover:bg-border-subtle-dark"
                    >
                        {hasMounted && theme === "dark" ? (
                            <Sun className="h-4 w-4" strokeWidth={2} />
                        ) : (
                            <Moon className="h-4 w-4" strokeWidth={2} />
                        )}
                    </button>

                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox:
                                    "w-7 h-7 ring-2 ring-border/50 dark:ring-border-dark/50 hover:ring-brand/30 transition-all duration-200",
                                userButtonPopoverCard:
                                    "shadow-dropdown border border-border dark:border-border-dark rounded-xl",
                            },
                        }}
                    />
                </div>
            </header>

            <AdminCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </>
    );
}