"use client";

import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

/**
 * Dedicated shell for the platform admin console (/admin/*).
 *
 * Deliberately NOT the landlord AppShell: platform admins must never see
 * landlord navigation or tenant context, and landlords must never render a
 * single byte of console chrome. Route enforcement happens in the proxy
 * (server-side) — this shell is pure presentation.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden">
            <AdminSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
                <AdminTopbar />
                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
