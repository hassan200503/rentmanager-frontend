# Architecture Overview

This document explains the important boundaries, access controls, and where to find core logic.

## Core principles

- Separation of public and authenticated routes to avoid loading auth-related bundles on marketing pages.
- Route-level RBAC enforced early (middleware/proxy) to fail fast and audit decisions.
- Typed API surface: OpenAPI-driven types to keep client & server contracts aligned.

## Key locations

- Entry & providers: `src/app/layout.tsx`, `src/app/(app)/layout.tsx`
- RBAC proxy: `src/proxy.ts`
- Route policy logic: `src/lib/rbac/route-policy.ts`
- Environment validation: `src/lib/config/validation.ts`
- Features: `src/features/*`

## How the request flow works (simplified)

1. Request arrives.
2. `src/proxy.ts` inspects the pathname and Clerk session claims.
3. Resolve policy via `resolveRoutePolicy()` — action: `next`, `sign-in`, or `redirect`.
4. If allowed, Next.js renders the route. Authenticated routes render under `(app)` where ClerkProvider is present.
5. Client-side API calls use `NEXT_PUBLIC_API_URL` as the base and rely on typed endpoints.

## Observability & audit

- Decisions in the proxy are recorded via audit helpers. Sentry integration is available for runtime error capture.

## Deployment patterns

- Containerized: Dockerfile included.
- Netlify: `netlify.toml` present for static/serverless deployment.
- Cloudflare/OpenNext: `open-next.config.ts` and `wrangler.jsonc` provided for Workers deployments.

## Where to look first

- `src/app/layout.tsx` — provider composition
- `src/proxy.ts` — route-level RBAC & Clerk middleware bridging
- `src/lib/rbac/route-policy.ts` — central policy decision logic
- `src/features/*` — feature-level UI + data hooks
