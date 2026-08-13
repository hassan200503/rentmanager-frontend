// components/tenant-shell.tsx
"use client";

import { useState } from "react";
import TenantSidebar from "./tenant-sidebar";
import TenantTopbar from "./tenant-topbar";

export default function TenantShell({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="tenant-portal-shell h-screen flex">
            <TenantSidebar mobileOpen={mobileOpen} onOpenChange={setMobileOpen} />
            <div className="flex flex-col flex-1 min-w-0">
                <TenantTopbar onOpenMenu={() => setMobileOpen(true)} />
                <main className="tenant-portal-scroll flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
            </div>
        </div>
    );
}
