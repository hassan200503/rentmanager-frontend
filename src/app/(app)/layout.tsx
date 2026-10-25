import { ReactNode } from "react";
import AuthProvider from "@/providers/auth-provider";

/**
 * The boundary where Clerk begins.
 *
 * <h2>Why this group exists</h2>
 * `ClerkProvider` used to sit in the root layout, which meant every page
 * bootstrapped Clerk — including the landing page, the listings and the policy
 * pages, where nothing renders a Clerk component. Measured in a browser against
 * the live site, that cost roughly 240 KB of JavaScript fetched from Clerk's
 * domain (`clerk.browser.js`, then `@clerk/ui` and four more chunks), beginning
 * at 5.6 s and still arriving at 33 s, competing with hydration for pages that
 * had no use for any of it.
 *
 * A route group changes no URL. `(app)` is a grouping folder, so
 * `(app)/dashboard/page.tsx` is still `/dashboard`; the proxy matcher, every
 * link and every redirect target are untouched. All it does is give the routes
 * that need a session a layout of their own to hang the provider on.
 *
 * <h2>What lives here, and what deliberately does not</h2>
 * Inside: `/admin`, `/dashboard`, `/portal`, `/onboarding`, `/continue`,
 * `/daraja` and `/public/sign-in|sign-up|forgot-password` — everything that
 * reads a session, renders a Clerk component, or (in `/onboarding`'s case)
 * creates a Clerk organisation.
 *
 * Outside, at the root: `/`, `/listings`, `/legal/*`, `/reserve/*`,
 * `/tenant-required`, `/icon`, the sitemap and the Clerk webhook route. Every
 * one was checked to import no Clerk hook, directly or through a feature
 * module: the public listings use `use-public-properties`, and `lib/auth/token`
 * is reached only from authenticated queries. `/reserve` is the flow where a
 * stranger reserves a vacant unit and pays a deposit by M-PESA — it never asks
 * who they are, which is the point of it.
 *
 * <h2>The failure mode to watch for</h2>
 * If a page outside this group ever calls a Clerk hook, it throws at runtime
 * with no provider above it. So a new page that needs a session belongs in
 * `(app)`, and a shared component that starts calling `useAuth()` has to be
 * checked against the marketing pages that render it. This is the whole reason
 * `prefetchUI: false` was rejected as the cheap alternative: it would have
 * silently broken the sign-in form instead, which is worse than an error.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
