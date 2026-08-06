"use client";

import { UserButton } from "@clerk/nextjs";
import { ShieldCheck, Loader2 } from "lucide-react";
import { usePlatformRole } from "@/features/admin/hooks/use-platform-role";

/**
 * Top bar for the platform admin console. Shows the caller's platform
 * sub-role (OWNER | ADMIN) resolved from the backend JWT template via
 * /admin/info — same query the console page uses, deduplicated by the
 * react-query cache.
 */
export default function AdminTopbar() {
    const { role, isLoading, isDenied } = usePlatformRole();

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 dark:border-border-dark/60 bg-surface/80 dark:bg-surface-dark/80 px-6 backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm shadow-blue-500/20">
                    <ShieldCheck className="h-4 w-4 text-white" strokeWidth={2} />
                </div>
                <span className="text-sm font-semibold text-fg dark:text-fg-dark">
                    Platform Admin Console
                </span>
                {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                ) : !isDenied && role ? (
                    <span className="rounded-full border border-brand/20 bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                        {role}
                    </span>
                ) : null}
            </div>

            <div className="flex items-center gap-2">
                <span className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border dark:border-border-dark px-2.5 py-1 text-[11px] font-medium text-fg-muted dark:text-fg-muted-dark">
                    <span className="status-dot-success status-dot-live" />
                    Platform-wide scope
                </span>
                <UserButton
                    appearance={{
                        elements: {
                            avatarBox:
                                "w-7 h-7 ring-2 ring-border/50 dark:ring-border-dark/50 hover:ring-brand/30 transition-all duration-200",
                            userButtonPopoverCard:
                                "shadow-dropdown border border-border dark:border-border-dark rounded-xl",
                        },
                    }}
                />
            </div>
        </header>
    );
}
