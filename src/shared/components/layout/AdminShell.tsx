"use client";

import { useState, useSyncExternalStore } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

const COLLAPSE_KEY = "admin-sidebar-collapsed";
const COLLAPSE_EVENT = "admin-sidebar-collapsed-change";

function readCollapsed(): boolean {
    try {
        return window.localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
        return false;
    }
}

/**
 * Dedicated shell for the platform admin console (/admin/*).
 *
 * Deliberately NOT the landlord AppShell: platform admins must never see
 * landlord navigation or tenant context, and landlords must never render a
 * single byte of console chrome. Route enforcement happens in the proxy
 * (server-side) — this shell is pure presentation.
 *
 * Desktop: fixed-width sidebar (collapsible, state persisted across
 * sessions and tabs). Mobile: off-canvas drawer with a blurred scrim,
 * driven by the topbar hamburger. The drawer always renders the full
 * (expanded) sidebar so the console never gets stuck collapsed on narrow
 * viewports; the expand control itself is always reachable via a tab
 * pinned to the rail edge.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const collapsed = useSyncExternalStore(
        (cb) => {
            window.addEventListener("storage", cb);
            window.addEventListener(COLLAPSE_EVENT, cb);
            return () => {
                window.removeEventListener("storage", cb);
                window.removeEventListener(COLLAPSE_EVENT, cb);
            };
        },
        readCollapsed,
        () => false
    );

    const toggleCollapsed = () => {
        const next = !readCollapsed();
        try {
            window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
        } catch {
            /* private mode / storage disabled — state still toggles */
        }
        window.dispatchEvent(new Event(COLLAPSE_EVENT));
    };

    return (
        <div className="flex h-screen overflow-hidden bg-surface dark:bg-surface-dark">
            {/* Desktop sidebar */}
            <div className="hidden h-full shrink-0 lg:block">
                <AdminSidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
            </div>

            {/* Mobile drawer */}
            <div
                className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
                aria-hidden={!mobileOpen}
            >
                <div
                    className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
                        mobileOpen ? "opacity-100" : "opacity-0"
                    }`}
                    onClick={() => setMobileOpen(false)}
                />
                <aside
                    className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] transition-transform duration-300 ease-[var(--ease-settle)] ${
                        mobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    <AdminSidebar
                        collapsed={false}
                        onNavigate={() => setMobileOpen(false)}
                    />
                </aside>
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                <AdminTopbar onOpenSidebar={() => setMobileOpen(true)} />
                <main className="flex-1 overflow-y-auto custom-scrollbar">{children}</main>
            </div>
        </div>
    );
}
