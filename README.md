# RentManager Frontend

[![License](https://img.shields.io/github/license/hassan200503/rentmanager-frontend)](https://github.com/hassan200503/rentmanager-frontend/blob/main/LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/hassan200503/rentmanager-frontend)](https://github.com/hassan200503/rentmanager-frontend/commits/main)
[![Issues](https://img.shields.io/github/issues/hassan200503/rentmanager-frontend)](https://github.com/hassan200503/rentmanager-frontend/issues)
[![Stars](https://img.shields.io/github/stars/hassan200503/rentmanager-frontend)](https://github.com/hassan200503/rentmanager-frontend/stargazers)

RentManager Frontend is the web client for a production-grade property-management platform focused on the Kenyan rental market. It provides landlord dashboards, renter portals, public listings, reservation flows, and admin tooling for rent, maintenance, receipts, and compliance tasks.

This repository uses Next.js (App Router) with TypeScript, Clerk for authentication, a route-level RBAC proxy, and OpenAPI-driven typing for API contracts. It is structured for performance (public pages avoid loading auth bundles), security (environment validation and defense-in-depth RBAC), and deployability across Cloudflare/OpenNext, Netlify, Docker, and standard Node hosts.

---

## Table of contents

- Overview
- Tech stack
- Architecture at a glance
- Repo layout
- Quick start (developer)
- Getting a test Clerk account
- Environment variables (high level)
- Running locally
- Building for production
- Testing & CI
- Deployment options
- Security notes
- Contributing & recruiting guidance
- Troubleshooting
- Key files
- License

---

## Overview

The frontend serves four personas:

- Landlords — rent collection, occupancy, leases, maintenance triage, accounting and disbursements
- Renters — payment flows (M-Pesa), maintenance reporting, announcements, lease access
- Admins — platform management, tenant and org oversight
- Public visitors — marketing, property listings, reservations

Public pages are intentionally isolated from the authenticated shell so that Clerk and other heavy bundles are not loaded on landing and listing pages.

---

## Tech stack

- Language: TypeScript
- Framework: Next.js 16 (App Router)
- Styling: Tailwind CSS v4, PostCSS
- Authentication: Clerk (@clerk/nextjs)
- Data & caching: @tanstack/react-query
- Forms & validation: react-hook-form + zod
- State: zustand
- Charts/visuals: recharts, three.js + @react-three/*
- Motion/UX: framer-motion, gsap, lenis
- Notifications: sonner
- Testing: vitest (unit), Playwright available for e2e
- Deployment helpers: OpenNext (Cloudflare), netlify.toml, Dockerfile

---

## Architecture at a glance

- Provider & metadata composition lives in `src/app/layout.tsx`.
- Authenticated pages live in `src/app/(app)/` and are wrapped with Clerk providers in `src/app/(app)/layout.tsx`.
- Route-level RBAC and early blocking are implemented in `src/proxy.ts`, which translates Clerk session claims into policy decisions from `src/lib/rbac/route-policy.ts`.
- Environment validation uses `src/lib/config/validation.ts` (zod) and fails fast on invalid or missing runtime configuration.
- Features are organized under `src/features/*` (renter, landlord, maintenance, lease, property, tenant, admin, etc.).

This design enforces performance (public pages stay small), security (guard before rendering), and type safety (OpenAPI-driven client types).

---

## Repository layout

```text
.
├── src/
│   ├── app/                # Next.js App Router (pages, layouts, api routes)
│   ├── features/           # Domain feature modules
│   ├── providers/          # Query, theme and other providers
│   ├── lib/                # Auth, RBAC, api clients, config, utilities
│   ├── shared/             # Shared UI components
│   ├── stores/             # zustand stores
│   └── types/              # TS types
├── public/                 # Static assets (og images, icons, screenshots)
├── .env.example            # Env template validated at startup
├── Dockerfile
├── netlify.toml
├── open-next.config.ts
├── wrangler.jsonc
├── package.json
├── tsconfig.json
├── README.md
├── CONTRIBUTING.md
└── docs/ or companion MD files
```

---

## Quick start (developer)

Prerequisites
- Node.js 18+ (LTS recommended)
- npm
- Running backend API (or a dev mock)
- Clerk test project (publishable & secret keys)

Steps

```bash
git clone https://github.com/hassan200503/rentmanager-frontend.git
cd rentmanager-frontend
npm ci
cp .env.example .env.local
# edit .env.local to point to your local backend and Clerk test keys
npm run dev
```

Open http://localhost:3000

The app performs env validation on startup — missing or invalid required values produce descriptive errors.

---

## Getting a test Clerk account (short guide)

1. Sign up at https://clerk.com and create a new project (development).
2. From the Clerk dashboard, copy the Publishable key (pk_...) and the Secret key (sk_...).
3. (Optional) Configure a JWT template (commonly named `backend`) that contains platform claims like `platformRole` and `tenant_id` if your backend validates them.
4. (Optional) Configure a webhook and copy the signing secret for `CLERK_WEBHOOK_SIGNING_SECRET` if you plan to test webhook flows.
5. Add the keys to `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
```

6. Start the app and sign in via `/public/sign-in` (the app uses branded sign-in routes).

Notes: For admin/landlord flows you may need test users with specific claims; coordinate with the backend to mint test tokens or seed users.

---

## Environment variables (high level)

See `.env.example` and `src/lib/config/.env.example` for full lists. The most critical values:

- `NEXT_PUBLIC_API_URL` (required) — base API origin and MUST include the `/api/v1` suffix. The app validates and normalizes this value.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (required)
- `CLERK_SECRET_KEY` (required for server routes)
- `NEXT_PUBLIC_APP_URL` (recommended)
- `NEXT_PUBLIC_SENTRY_DSN` (optional — enable Sentry)

Remember: `NEXT_PUBLIC_*` variables are public at build-time. Keep sensitive keys server-side.

---

## Running locally

```bash
npm run dev
```

If you need to run only parts of the app (e.g., public pages) ensure the environment is set accordingly. Auth pages live under the `(app)` route group and require Clerk.

---

## Building for production

```bash
npm run build
npm start
```

Provide production environment variables via your host (Netlify/Cloudflare Secrets/Container envs). Ensure `NEXT_PUBLIC_API_URL` points to the production API and includes `/api/v1`.

---

## Testing & CI

Unit tests: `npm test` (Vitest)
Lint: `npm run lint`

Playwright is included in devDependencies for e2e; add CI jobs to run it if you include e2e tests.

---

## Deployment options

Supported in-repo configs:
- Docker (Dockerfile)
- Netlify (netlify.toml)
- Cloudflare/OpenNext (open-next.config.ts, wrangler.jsonc)
- Standard Node hosting (next build / next start)

Pick the target and ensure required secrets are populated in the provider.

---

## Security notes

- Do not commit secrets. Keep server-only keys (`CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, webhook secrets) in your hosting or CI secret manager.
- `src/proxy.ts` enforces RBAC as a defense-in-depth measure; critical authorization must still be verified by the backend API.
- The frontend validates environment variables at startup to reduce misconfiguration risk.

See `SECURITY.md` for responsible disclosure guidance.

---

## Contributing & recruiter guidance

This repo is arranged to be recruiter-friendly: clear architecture, typed API contracts, environment validation, and multiple deployment configs.

Before opening a PR:
- run `npx tsc --noEmit`
- run `npm test` and `npm run lint`
- include a short description, testing steps, and screenshots/GIFs for UI changes

See `CONTRIBUTING.md` for the full workflow.

---

## Troubleshooting

- 404s: ensure `NEXT_PUBLIC_API_URL` ends with `/api/v1`.
- Clerk issues: validate Clerk keys and the `NEXT_PUBLIC_APP_URL` configuration in the Clerk dashboard.
- Redirects using `http` instead of `https`: verify hosting forwarded-proto headers and `NEXT_PUBLIC_APP_URL`.
- Env validation errors: read the zod validation messages in `src/lib/config/validation.ts`.

---

## Key files

- `src/proxy.ts` — route-level RBAC proxy
- `src/app/(app)/layout.tsx` — authenticated route boundary
- `src/app/layout.tsx` — global providers & metadata
- `src/lib/config/validation.ts` — env validation logic
- `src/lib/rbac/route-policy.ts` — access policy
- `src/features/*` — domain modules

---

## License

MIT — see `LICENSE` in the repository root.

---
   
 