// components/tenant-sidebar.tsx
"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
    LayoutDashboard,
    CreditCard,
    FileText,
    Wrench,
    HelpCircle,
    Building2,
    Sparkles,
    X,
    Sun,
    Moon,
    ChevronLeft,
    ChevronRight,
    Menu as MenuIcon,
} from "lucide-react";
import { BrandBadge } from "@/shared/components/brand";
import { useTenantDashboardQuery, useTenantLeaseQuery } from "../hooks/use-tenant-portal-queries";
import { isPremiumLandlord } from "../api/tenant-portal-api";

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    disabled?: boolean;
    badge?: string;
}

const baseNavItems: NavItem[] = [
    { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
    { href: "/portal/payments", label: "Payments", icon: CreditCard },
    { href: "/portal/lease", label: "Lease", icon: FileText },
    { href: "/portal/landlord", label: "Landlord", icon: Building2 },
];

const secondaryNavItems: NavItem[] = [
    { href: "/portal/maintenance", label: "Maintenance", icon: Wrench },
    { href: "#help", label: "Help & Support", icon: HelpCircle, disabled: true },
];

function isItemActive(pathname: string | null, href: string) {
    if (href === "/portal") return pathname === href;
    return pathname?.startsWith(href) ?? false;
}

function NavLink({
    item,
    active,
    collapsed,
    onNavigate,
}: {
    item: NavItem;
    active: boolean;
    collapsed: boolean;
    onNavigate?: () => void;
}) {
    const Icon = item.icon;
    const base = `group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 ${
        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
    } ${
        active
            ? "text-brand-800 dark:text-brand-300"
            : "text-fg-muted hover:text-fg dark:text-fg-muted-dark dark:hover:text-fg-dark"
    }`;

    const inner = (
        <>
            {active && (
                <span className="absolute inset-0 rounded-xl bg-brand-50 dark:bg-brand-900/30 shadow-sm" />
            )}
            <span
                className={`relative shrink-0 transition-all duration-150 ${
                    active
                        ? "text-brand dark:text-brand-400"
                        : "text-fg-subtle dark:text-fg-subtle-dark group-hover:text-fg-muted dark:group-hover:text-fg-muted-dark"
                }`}
            >
                <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={active ? 2.5 : 2} />
            </span>
            {!collapsed && <span className="relative flex-1">{item.label}</span>}
            {!collapsed && item.badge && (
                <span className="relative inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-gradient-to-r from-brand to-brand-500 text-white dark:from-brand-400 dark:to-brand-500 dark:text-brand-950 shadow-sm">
                    {item.badge === "Premium" && <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} />}
                    {item.badge}
                </span>
            )}
        </>
    );

    if (item.disabled) {
        return (
            <span
                aria-disabled="true"
                title={collapsed ? item.label : undefined}
                className={`${base} opacity-60 cursor-not-allowed`}
            >
                {inner}
            </span>
        );
    }

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={base}
        >
            {inner}
        </Link>
    );
}

function TenantSidebarBody({
    collapsed,
    onToggle,
    onNavigate,
}: {
    collapsed: boolean;
    onToggle: () => void;
    onNavigate?: () => void;
}) {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const { data } = useTenantDashboardQuery();
    const { data: lease } = useTenantLeaseQuery();

    const navItems: NavItem[] = baseNavItems.map((item) =>
        item.href === "/portal/landlord"
            ? { ...item, badge: isPremiumLandlord(lease ?? { billingMode: null, subscriptionStatus: null }) ? "Premium" : undefined }
            : item,
    );

    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );

    const tenantName = data?.tenantName ?? "Tenant";
    const unitInfo = data?.unitNumber
        ? `Unit ${data.unitNumber}${data?.propertyName ? ` · ${data.propertyName}` : ""}`
        : "Your rental home";

    const initials =
        tenantName
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "T";

    const themeButton = () => (
        <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-fg-subtle dark:text-fg-subtle-dark hover:text-fg dark:hover:text-fg-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
        >
            {mounted && theme === "dark" ? (
                <Sun className="h-3.5 w-3.5" strokeWidth={2} />
            ) : (
                <Moon className="h-3.5 w-3.5" strokeWidth={2} />
            )}
        </button>
    );

    return (
        <>
            {/* Logo / brand */}
            <div
                className={`h-14 flex items-center shrink-0 border-b border-border dark:border-border-dark ${
                    collapsed ? "justify-center px-2" : "gap-3 px-4"
                }`}
            >
                {!collapsed ? (
                    <span className="inline-flex items-center gap-2.5">
                        <BrandBadge size="md" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-brand dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 px-1.5 py-0.5 rounded-md border border-brand-200 dark:border-brand-700">
                            Tenant
                        </span>
                    </span>
                ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30">
                        <BrandBadge size="sm" />
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5 custom-scrollbar">
                {!collapsed && (
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-fg-subtle dark:text-fg-subtle-dark">
                        Main
                    </p>
                )}
                {navItems.map((item) => (
                    <NavLink
                        key={item.href}
                        item={item}
                        active={isItemActive(pathname, item.href)}
                        collapsed={collapsed}
                        onNavigate={onNavigate}
                    />
                ))}

                <div className={`my-3 h-px bg-border dark:bg-border-dark ${collapsed ? "mx-2" : ""}`} aria-hidden />

                {!collapsed && (
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-fg-subtle dark:text-fg-subtle-dark">
                        More
                    </p>
                )}
                {secondaryNavItems.map((item) => (
                    <NavLink
                        key={item.label}
                        item={item}
                        active={false}
                        collapsed={collapsed}
                        onNavigate={onNavigate}
                    />
                ))}
            </nav>

            {/* Collapse toggle (desktop only) */}
            <div className="hidden md:flex px-2 pb-2 shrink-0">
                <button
                    type="button"
                    onClick={onToggle}
                    className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-fg-subtle dark:text-fg-subtle-dark hover:text-fg-muted dark:hover:text-fg-muted-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? (
                        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                    ) : (
                        <>
                            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
                            <span>Collapse</span>
                        </>
                    )}
                </button>
            </div>

            {/* User section */}
            <div
                className={`border-t border-border dark:border-border-dark shrink-0 p-3 ${
                    collapsed ? "space-y-2" : "space-y-3"
                }`}
            >
                <div
                    className={`flex items-center rounded-xl bg-brand-50/50 dark:bg-brand-900/15 border border-brand-100/50 dark:border-brand-800/30 ${
                        collapsed ? "justify-center p-2" : "gap-3 px-2 py-2"
                    }`}
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-800 text-[13px] font-semibold text-brand-700 dark:text-brand-300 ring-2 ring-brand-50 dark:ring-brand-900/20">
                        {initials}
                    </div>
                    {!collapsed && (
                        <>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-fg dark:text-fg-dark">{tenantName}</p>
                                <p className="truncate text-[11px] text-fg-muted dark:text-fg-muted-dark">{unitInfo}</p>
                            </div>
                            {themeButton()}
                        </>
                    )}
                    {collapsed && themeButton()}
                </div>
            </div>
        </>
    );
}


/* ── Mobile Bottom Tab Bar ───────────────────────────────────── */
function MobileTabBar({ onOpenMore }: { onOpenMore: () => void }) {
    const pathname = usePathname();

    return (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-lg border-t border-border dark:border-border-dark safe-area-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {baseNavItems.map((item) => {
                    const active = isItemActive(pathname, item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[3.5rem] ${
                                active ? "text-brand dark:text-brand-400" : "text-fg-subtle dark:text-fg-subtle-dark"
                            }`}
                        >
                            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.75} />
                            <span className={`text-[10px] leading-tight ${active ? "font-semibold" : "font-medium"}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
                <button
                    type="button"
                    onClick={onOpenMore}
                    className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[3.5rem] text-fg-subtle dark:text-fg-subtle-dark"
                    aria-label="Open more"
                >
                    <MenuIcon className="h-5 w-5" strokeWidth={1.75} />
                    <span className="text-[10px] leading-tight font-medium">More</span>
                </button>
            </div>
        </nav>
    );
}

/* ── Tenant Sidebar ──────────────────────────────────────────── */
export default function TenantSidebar({
    mobileOpen,
    onOpenChange,
}: {
    mobileOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <>
            {/* Desktop sidebar */}
            <aside
                className="hidden md:flex flex-col bg-surface dark:bg-surface-dark border-r border-border dark:border-border-dark shrink-0 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: collapsed ? "4.5rem" : "16rem" }}
            >
                <TenantSidebarBody collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
            </aside>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => onOpenChange(false)}
                        aria-hidden
                    />
                    <aside className="relative w-64 flex flex-col bg-surface dark:bg-surface-dark border-r border-border dark:border-border-dark shadow-dropdown">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            aria-label="Close navigation"
                            className="absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted dark:text-fg-muted-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark"
                        >
                            <X className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <TenantSidebarBody
                            collapsed={false}
                            onToggle={() => onOpenChange(false)}
                            onNavigate={() => onOpenChange(false)}
                        />
                    </aside>
                </div>
            )}

            {/* Mobile bottom tab bar */}
            <MobileTabBar onOpenMore={() => onOpenChange(true)} />
        </>
    );
}

