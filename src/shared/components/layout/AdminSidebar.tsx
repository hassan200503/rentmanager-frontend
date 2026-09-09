"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
    LayoutDashboard,
    Building2,
    Users,
    Home,
    Send,
    Wallet,
    Settings,
    Star,
    ShieldCheck,
    Plug,
    ChevronsLeft,
    ChevronsRight,
    Sun,
    Moon,
    type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { PlatformBrand, PlatformLogoMark } from "@/shared/components/brand";

interface AdminNavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    disabled?: boolean;
}

const PRIMARY_NAV: AdminNavItem[] = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
];

const WORKSPACE_NAV: AdminNavItem[] = [
    { label: "Landlords", href: "/admin/landlords", icon: Building2 },
    { label: "Renters", href: "/admin/renters", icon: Users },
    { label: "Properties", href: "/admin/properties", icon: Home },
    { label: "Reviews", href: "/admin/reviews", icon: Star },
    { label: "Disbursements", href: "/admin/disbursements", icon: Send },
    { label: "Integrations", href: "/admin/integrations", icon: Plug },
    { label: "Subscription plans", href: "/admin/subscription-plans", icon: Wallet },
    { label: "Platform settings", href: "/admin/settings", icon: Settings },
];

function AdminNavLink({
    item,
    isActive,
    collapsed,
    onNavigate,
}: {
    item: AdminNavItem;
    isActive: boolean;
    collapsed: boolean;
    onNavigate?: () => void;
}) {
    const Icon = item.icon;
    const base =
        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150";
    const title = item.label;

    if (item.disabled) {
        return (
            <div
                className={`${base} cursor-not-allowed text-sidebar-fg-muted/60 ${collapsed ? "justify-center px-0" : ""}`}
                aria-disabled="true"
                title={collapsed ? title : undefined}
            >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {!collapsed && (
                    <>
                        <span className="flex-1 truncate">{item.label}</span>
                        <span className="rounded-full border border-border dark:border-border-dark px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-sidebar-fg-muted/70">
                            Soon
                        </span>
                    </>
                )}
            </div>
        );
    }

    return (
        <Link
            href={item.href}
            title={collapsed ? title : undefined}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={`${base} ${
                isActive
                    ? "console-nav-active"
                    : "text-sidebar-fg-muted hover:bg-sidebar-muted hover:text-sidebar-fg"
            } ${collapsed ? "justify-center px-0" : ""}`}
        >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.1 : 1.75} />
            {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            {!collapsed && isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-scale-in" />
            )}
        </Link>
    );
}

function NavGroup({
    label,
    items,
    pathname,
    collapsed,
    onNavigate,
}: {
    label: string;
    items: AdminNavItem[];
    pathname: string;
    collapsed: boolean;
    onNavigate?: () => void;
}) {
    return (
        <div>
            {!collapsed && (
                <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-fg-muted">
                    {label}
                </p>
            )}
            <div className="space-y-0.5">
                {items.map((item) => (
                    <AdminNavLink
                        key={item.href}
                        item={item}
                        collapsed={collapsed}
                        onNavigate={onNavigate}
                        isActive={
                            item.href === "/admin"
                                ? pathname === "/admin"
                                : pathname.startsWith(item.href)
                        }
                    />
                ))}
            </div>
        </div>
    );
}

function AdminSidebar({
    collapsed,
    onToggleCollapse,
    onNavigate,
}: {
    collapsed: boolean;
    onToggleCollapse?: () => void;
    onNavigate?: () => void;
}) {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const hasMounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );

    return (
        <aside
            className={`console-sidebar relative flex h-full flex-col border-r border-sidebar-border transition-[width] duration-200 ease-[var(--ease-settle)] ${
                collapsed
                    ? "w-[var(--console-sidebar-width-collapsed)]"
                    : "w-[var(--console-sidebar-width)]"
            }`}
        >
            {/* Brand lockup */}
            <div
                className={`flex h-16 shrink-0 items-center border-b border-sidebar-border ${
                    collapsed ? "justify-center" : "gap-3 px-5"
                }`}
            >
                <div className="relative shrink-0">
                    <div className="logo-tile h-9 w-9">
                        <PlatformLogoMark size={20} />
                    </div>
                    <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white dark:border-sidebar" />
                    </span>
                </div>
                {!collapsed && (
                    <div className="min-w-0">
                        <PlatformBrand size="sm" />
                        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-brand-600 dark:text-emerald-300">
                            Platform Console
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4 custom-scrollbar">
                <NavGroup
                    label="Console"
                    items={PRIMARY_NAV}
                    pathname={pathname}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                />
                <NavGroup
                    label="Management"
                    items={WORKSPACE_NAV}
                    pathname={pathname}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                />
            </nav>

            {/* Footer actions */}
            <div className="shrink-0 space-y-1 border-t border-sidebar-border px-3 py-3">
                <div className={`flex ${collapsed ? "flex-col" : "items-center"} gap-1`}>
                    {/* Theme toggle */}
                    <button
                        type="button"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        aria-label="Toggle theme"
                        title={collapsed ? "Toggle theme" : undefined}
                        className={`flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-sidebar-fg-muted transition-colors hover:bg-sidebar-muted hover:text-sidebar-fg ${
                            collapsed ? "justify-center px-0" : "flex-1 justify-center"
                        }`}
                    >
                        {hasMounted && theme === "dark" ? (
                            <Sun className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        ) : (
                            <Moon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        )}
                        {!collapsed && <span>Theme</span>}
                    </button>

                    {/* Collapse toggle (expanded state) */}
                    {!collapsed && onToggleCollapse && (
                        <button
                            type="button"
                            onClick={onToggleCollapse}
                            aria-label="Collapse sidebar"
                            title="Collapse sidebar"
                            className="flex h-9 flex-1 items-center justify-center gap-2.5 rounded-lg px-3 text-sm font-medium text-sidebar-fg-muted transition-colors hover:bg-sidebar-muted hover:text-sidebar-fg"
                        >
                            <ChevronsLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                            <span>Collapse</span>
                        </button>
                    )}
                </div>

                {/* Identity chip */}
                {!collapsed && (
                    <div className="flex items-center gap-2 rounded-lg bg-sidebar-muted px-3 py-2">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={2} />
                        <span className="text-[11px] font-medium text-sidebar-fg-muted">
                            Platform-wide scope
                        </span>
                    </div>
                )}
            </div>

            {/* Expand tab — pinned to the rail edge while collapsed */}
            {collapsed && onToggleCollapse && (
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    aria-label="Expand sidebar"
                    title="Expand sidebar"
                    className="absolute -right-3 bottom-16 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-fg-muted shadow-lg transition-colors hover:border-brand/40 hover:text-brand"
                >
                    <ChevronsRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
            )}
        </aside>
    );
}

export default AdminSidebar;