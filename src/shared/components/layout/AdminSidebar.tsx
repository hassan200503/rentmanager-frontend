"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Building2,
    Users,
    Home,
    Send,
    Wallet,
    Settings,
    ArrowLeftRight,
    ShieldCheck,
    type LucideIcon,
} from "lucide-react";
import { BrandBadge } from "@/shared/components/brand";

interface AdminNavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    disabled?: boolean;
    active?: boolean;
}

const PRIMARY_NAV: AdminNavItem[] = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
];

const WORKSPACE_NAV: AdminNavItem[] = [
    { label: "Landlords", href: "/admin/landlords", icon: Building2, disabled: true },
    { label: "Renters", href: "/admin/renters", icon: Users, disabled: true },
    { label: "Properties", href: "/admin/properties", icon: Home, disabled: true },
    { label: "Disbursements", href: "/admin/disbursements", icon: Send, disabled: true },
    { label: "Commission policy", href: "/admin/commission", icon: Wallet, disabled: true },
    { label: "Platform settings", href: "/admin/settings", icon: Settings, disabled: true },
];

function AdminNavLink({
    item,
    isActive,
}: {
    item: AdminNavItem;
    isActive: boolean;
}) {
    const Icon = item.icon;
    if (item.disabled) {
        return (
            <div
                className="group flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-400/60"
                aria-disabled="true"
            >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="flex-1">{item.label}</span>
                <span className="rounded-full border border-slate-700/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                    Soon
                </span>
            </div>
        );
    }
    return (
        <Link
            href={item.href}
            className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                    ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/20"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
        >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {item.label}
        </Link>
    );
}

function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="flex h-full w-64 shrink-0 flex-col bg-slate-900 text-slate-200">
            {/* Brand */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
                    <ShieldCheck className="h-4 w-4 text-white" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                    <BrandBadge size="sm" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300/90">
                        Platform Console
                    </p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 custom-scrollbar">
                <div>
                    <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                        Console
                    </p>
                    <div className="space-y-0.5">
                        {PRIMARY_NAV.map((item) => (
                            <AdminNavLink
                                key={item.href}
                                item={item}
                                isActive={pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                        Management
                    </p>
                    <div className="space-y-0.5">
                        {WORKSPACE_NAV.map((item) => (
                            <AdminNavLink
                                key={item.href}
                                item={item}
                                isActive={pathname.startsWith(item.href)}
                            />
                        ))}
                    </div>
                </div>
            </nav>

            {/* Footer */}
            <div className="border-t border-white/10 px-3 py-3 space-y-1">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                    <ArrowLeftRight className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    Landlord workspace
                </Link>
            </div>
        </aside>
    );
}

export default AdminSidebar;