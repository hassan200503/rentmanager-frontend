"use client";

import { UserButton } from "@clerk/nextjs";
import OrgSwitcher from "@/shared/components/org/OrgSwitcher";

export default function Topbar() {
    return (
        <header className="h-16 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-sm border-b border-border dark:border-border-dark flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-2 text-sm text-fg-muted dark:text-fg-muted-dark">
                <span className="status-dot-success status-dot-live" />
                <span>All systems operational</span>
            </div>

            <div className="flex items-center gap-4">
                <OrgSwitcher />
                <div className="h-6 w-px bg-border dark:bg-border-dark" />
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