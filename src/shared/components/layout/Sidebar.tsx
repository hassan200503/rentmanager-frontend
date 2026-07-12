"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    {
        href: "/dashboard",
        label: "Dashboard",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <rect x="3" y="3" width="7" height="9" rx="1.5" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" />
                <rect x="3" y="16" width="7" height="5" rx="1.5" />
            </svg>
        ),
    },
    {
        href: "/dashboard/properties",
        label: "Properties",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
            </svg>
        ),
    },







    {
        href: "/dashboard/leases",
        label: "Leases",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M7 3h8l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
                <path d="M9 12h6M9 16h6M9 8h3" />
            </svg>
        ),
    },






    {
        href: "/dashboard/team",
        label: "Team",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="9" cy="8" r="3" />
                <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
                <circle cx="17" cy="8" r="2.5" />
                <path d="M15.5 20a5.5 5.5 0 0 1 5.5-5.5" />
            </svg>
        ),
    },
];

export default function Sidebar() {
    const pathname = usePathname();

    const isActive = (href: string) =>
        href === "/dashboard" ? pathname === href : pathname?.startsWith(href);

    return (
        <aside className="w-64 hidden md:flex flex-col bg-surface border-r border-ink/[0.08]">
            <div className="h-16 flex items-center gap-2.5 px-5 border-b border-ink/[0.08]">
                <span className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                    <span className="font-data text-xs font-semibold text-white">R</span>
                </span>
                <span className="font-display text-[15px] font-semibold text-ink tracking-tight">
                    RentManager
                </span>
            </div>

            <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                                active
                                    ? "bg-primary-light text-primary-dark"
                                    : "text-ink-muted hover:text-ink hover:bg-ink/[0.04]"
                            }`}
                        >
                            <span className={active ? "text-primary" : "text-ink-muted"}>
                                {item.icon}
                            </span>
                            {item.label}
                            {active && (
                                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brass" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-ink/[0.08]">
                <div className="rounded-lg bg-ink/[0.03] px-3 py-2.5">
                    <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wide">Pilot build</p>
                    <p className="text-xs text-ink-muted mt-0.5">More modules rolling out soon</p>
                </div>
            </div>
        </aside>
    );
}