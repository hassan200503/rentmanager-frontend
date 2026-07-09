"use client";

import { UserButton } from "@clerk/nextjs";
import OrgSwitcher from "@/shared/components/org/OrgSwitcher";

export default function Topbar() {
    return (
        <header className="h-16 bg-surface/80 backdrop-blur-sm border-b border-ink/[0.08] flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-2 text-sm text-ink-muted">
                <span className="status-dot-live" />
                <span>All systems operational</span>
            </div>

            <div className="flex items-center gap-4">
                <OrgSwitcher />
                <div className="h-6 w-px bg-ink/[0.08]" />
                <UserButton
                    appearance={{
                        elements: {
                            avatarBox: "w-8 h-8",
                        },
                    }}
                />
            </div>
        </header>
    );
}