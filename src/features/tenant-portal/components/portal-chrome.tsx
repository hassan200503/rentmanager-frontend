// components/portal-chrome.tsx
//
// Shared page chrome for the renter portal.
//
// WHY THIS EXISTS. The dashboard was built against a premium visual language
// (.tenant-panel glass surfaces, .tenant-eyebrow kickers, .tenant-empty-state,
// .tenant-skeleton-premium) while every other portal page rolled its own header
// out of generic .card-elevated / .page-title utilities — and several (payments,
// maintenance, reviews) had no page header at all. Seven dialects on one product
// is the single biggest reason the portal reads as cheaper the moment you leave
// the dashboard.
//
// These components deliberately COMPOSE the existing CSS primitives rather than
// introducing a parallel set of styles. If the design language changes, it
// changes in globals.css and everything here follows.
"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Standard portal page shell: consistent max width, rhythm and entrance.
 * Every portal route should render through this so vertical spacing and
 * content width never drift between pages.
 */
export function PortalPage({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={`page-container animate-fade-in-up py-6 sm:py-8 space-y-5 ${className}`}>
            {children}
        </div>
    );
}

/**
 * The page header every route was missing. Eyebrow + title + optional subtitle,
 * with an optional right-hand action slot — matching the dashboard hero's
 * typographic hierarchy (kicker above, display title, muted supporting line).
 *
 * When `thumbnailUrl` is supplied it takes precedence over `icon` — the slot
 * renders the actual property photo instead of a generic icon placeholder.
 */
export function PortalPageHeader({
    eyebrow,
    title,
    subtitle,
    icon: Icon,
    thumbnailUrl,
    actions,
}: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    thumbnailUrl?: string | null;
    actions?: ReactNode;
}) {
    return (
        <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
                {thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={thumbnailUrl}
                        alt=""
                        aria-hidden
                        className="mt-0.5 hidden sm:block h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-black/[0.08] dark:ring-white/10 shadow-sm"
                    />
                ) : Icon ? (
                    <span
                        className="mt-0.5 hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{
                            background:
                                "linear-gradient(140deg, color-mix(in srgb, var(--color-brand-500) 16%, transparent), color-mix(in srgb, var(--color-brand-500) 5%, transparent))",
                            border: "1px solid color-mix(in srgb, var(--color-brand-500) 18%, transparent)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
                        }}
                    >
                        <Icon className="h-[18px] w-[18px] text-brand-700 dark:text-brand-300" strokeWidth={2} />
                    </span>
                ) : null}
                <div className="min-w-0">
                    {eyebrow && <p className="tenant-eyebrow">{eyebrow}</p>}
                    <h1 className="tenant-hero-title tenant-hero-title-premium !text-[1.5rem] sm:!text-[1.75rem] mb-0">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark max-w-prose">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
    );
}

/**
 * Premium surface. Wraps .tenant-panel (the same glass/elevation the dashboard
 * uses) so pages stop reaching for the flatter generic .card-elevated.
 */
export function PortalCard({
    children,
    className = "",
    padded = true,
}: {
    children: ReactNode;
    className?: string;
    padded?: boolean;
}) {
    return (
        <section className={`tenant-panel ${padded ? "!p-5 sm:!p-6" : "!p-0"} ${className}`}>
            {children}
        </section>
    );
}

/** Section heading inside a PortalCard — kicker + title + optional action. */
export function PortalCardHeader({
    kicker,
    title,
    action,
}: {
    kicker?: string;
    title: string;
    action?: ReactNode;
}) {
    return (
        <div className="tenant-panel-header">
            <div className="min-w-0">
                {kicker && <p className="tenant-panel-kicker">{kicker}</p>}
                <h2 className="tenant-panel-title">{title}</h2>
            </div>
            {action}
        </div>
    );
}

/**
 * Consistent empty state. Previously each page invented its own centred div,
 * with wildly different icon sizes and copy weights.
 */
export function PortalEmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="tenant-empty-state-premium flex flex-col items-center px-6 py-14 text-center">
            <div className="tenant-ledger-empty-icon relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                <Icon className="h-6 w-6 text-brand-600 dark:text-brand-300" strokeWidth={1.75} />
            </div>
            <p className="text-base font-semibold text-ink dark:text-ink-dark">{title}</p>
            {description && (
                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted dark:text-ink-muted-dark">
                    {description}
                </p>
            )}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

/**
 * Shimmer loading rows. Uses .tenant-skeleton-premium so loading states across
 * the portal share one motion signature instead of three different pulses.
 */
export function PortalSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="space-y-3" aria-hidden="true">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="tenant-panel !p-4 flex items-center gap-4">
                    <div className="tenant-skeleton-premium h-10 w-10 shrink-0 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <div className="tenant-skeleton-premium h-3.5 w-2/5 rounded" />
                        <div className="tenant-skeleton-premium h-3 w-1/4 rounded" />
                    </div>
                    <div className="tenant-skeleton-premium h-6 w-20 rounded-full" />
                </div>
            ))}
        </div>
    );
}

/** Error state with a retry affordance — pages previously showed dead ends. */
export function PortalErrorState({
    title = "Something went wrong",
    description,
    onRetry,
}: {
    title?: string;
    description?: string;
    onRetry?: () => void;
}) {
    return (
        <PortalCard>
            <div className="flex flex-col items-center px-6 py-12 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6 text-danger"
                        stroke="currentColor"
                        strokeWidth={1.9}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                    </svg>
                </div>
                <p className="text-base font-semibold text-ink dark:text-ink-dark">{title}</p>
                {description && (
                    <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted dark:text-ink-muted-dark">
                        {description}
                    </p>
                )}
                {onRetry && (
                    <button type="button" onClick={onRetry} className="btn-outline btn-sm mt-5">
                        Try again
                    </button>
                )}
            </div>
        </PortalCard>
    );
}
