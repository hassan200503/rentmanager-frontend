"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Building2,
    Receipt,
    FileText,
    Smartphone,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    ArrowLeftRight,
    Wallet,
    type LucideIcon,
} from "lucide-react";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/properties", label: "Properties", icon: Building2 },
    { href: "/dashboard/payments", label: "Transactions", icon: ArrowLeftRight },
    { href: "/dashboard/rent-ledger", label: "Rent ledger", icon: Receipt },
    { href: "/dashboard/leases", label: "Tenants", icon: Users },
    { href: "/daraja/config", label: "M-Pesa", icon: Smartphone },
    { href: "/dashboard/team", label: "Team", icon: Users },
];

const secondaryNavItems: NavItem[] = [
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function isItemActive(pathname: string | null, href: string) {
    if (href === "/dashboard") return pathname === href;
    return pathname?.startsWith(href) ?? false;
}

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                active
                    ? "bg-primary-light text-primary-dark"
                    : "text-ink-muted hover:text-ink hover:bg-ink/[0.04]"
            }`}
        >
            <span className={active ? "text-primary" : "text-ink-muted"}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            {item.label}
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brass" aria-hidden />}
        </Link>
    );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { user } = useCurrentUser();

    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

    const initials =
        [user?.firstName, user?.lastName]
            .filter((part): part is string => Boolean(part))
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "?";

    return (
        <>
            <div className="h-16 flex items-center gap-2.5 px-5 border-b border-ink/[0.08] shrink-0">
                <span className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                    <span className="font-data text-xs font-semibold text-white">R</span>
                </span>
                <span className="font-display text-[15px] font-semibold text-ink tracking-tight">
                    RentManager
                </span>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.href}
                        item={item}
                        active={isItemActive(pathname, item.href)}
                        onNavigate={onNavigate}
                    />
                ))}

                <div className="my-2 h-px bg-ink/[0.08]" aria-hidden />

                {secondaryNavItems.map((item) => (
                    <NavLink
                        key={item.href}
                        item={item}
                        active={isItemActive(pathname, item.href)}
                        onNavigate={onNavigate}
                    />
                ))}
            </nav>

            <div className="p-3 border-t border-ink/[0.08] shrink-0 space-y-3">
                <div className="rounded-lg bg-ink/[0.03] px-3 py-2.5">
                    <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wide">Pilot build</p>
                    <p className="text-xs text-ink-muted mt-0.5">More modules rolling out soon</p>
                </div>

                <div className="flex items-center gap-2.5 px-1">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-[11px] font-semibold text-primary-dark">
                        {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-ink">{fullName || "Account"}</p>
                        <p className="truncate text-[11px] text-ink-muted">{user?.email ?? ""}</p>
                    </div>
                    <button
                        type="button"
                        aria-label="Sign out"
                        onClick={() => {
                            // Wire up to your auth sign-out flow
                        }}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-ink/[0.06] transition-colors"
                    >
                        <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                </div>
            </div>
        </>
    );
}

export default function Sidebar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="w-64 hidden md:flex flex-col bg-surface border-r border-ink/[0.08]">
                <SidebarBody />
            </aside>

            {/* Mobile trigger */}
            <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                className="md:hidden fixed top-3 left-3 z-40 flex h-9 w-9 items-center justify-center rounded-lg bg-surface border border-ink/[0.08] text-ink-muted shadow-sm"
            >
                <Menu className="h-4.5 w-4.5" strokeWidth={2} />
            </button>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    <div
                        className="absolute inset-0 bg-ink/40"
                        onClick={() => setMobileOpen(false)}
                        aria-hidden
                    />
                    <aside className="relative w-64 flex flex-col bg-surface border-r border-ink/[0.08] animate-slide-in-left">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            aria-label="Close navigation"
                            className="absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-ink/[0.06]"
                        >
                            <X className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <SidebarBody onNavigate={() => setMobileOpen(false)} />
                    </aside>
                </div>
            )}
        </>
    );
}