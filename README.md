# RentManager Frontend

RentManager Frontend is the web application for RentManager, a property-management platform built for the Kenyan rental market. It powers landlord dashboards, renter portals, public listing pages, reservations, and admin workflows for managing rent, maintenance, deposits, disbursements, and compliance-related operations.

This repository is a Next.js 16 App Router application with TypeScript, Clerk authentication, a route-level RBAC proxy, OpenAPI-style API integration, and a production-oriented deployment configuration for Cloudflare, Netlify, Docker, and standard Node hosting.

## Overview

The frontend is designed around role-based access:

- Landlords use dashboards to manage rent, leases, units, maintenance, and accounting flows.
- Renters access a tenant portal for payments, issues, announcements, and lease information.
- Admins access an administrative console for platform-level oversight and management tasks.
- Public visitors can browse listings, view legal pages, and reserve vacant units without signing in.

The app is split between public pages and authenticated route groups, with the routing boundary enforced by a custom RBAC proxy and Clerk session claims.

## Stack

- Language: TypeScript
- Framework: Next.js 16 (App Router)
- Styling: Tailwind CSS v4
- Auth: Clerk (`@clerk/nextjs`)
- Data fetching: TanStack React Query
- Forms/validation: React Hook Form + Zod
- UI/animation: Framer Motion, GSAP, Lenis, Recharts, Lucide
- 3D visuals: `three` + `@react-three/*`
- Testing: Vitest
- Optional e2e: Playwright
- Deployment: Docker, Netlify, OpenNext/Cloudflare, standard Next.js hosting

## Key architecture decisions

- App Router route organization is under `src/app/`.
- Public routes are separated from authenticated route groups under `src/app/(app)` to avoid loading Clerk everywhere.
- Route protection is enforced by `src/proxy.ts`, which reads Clerk claims and applies route policies from `src/lib/rbac/route-policy.ts`.
- Runtime environment validation is enforced via `src/lib/config/validation.ts` to fail fast on missing or invalid required values.
- Server and client environment values are separated intentionally: public variables are prefixed `NEXT_PUBLIC_*`, while secret values remain server-side only.

## Repository structure

```text
.
├── src/
│   ├── app/                  # Next.js App Router pages and route trees
│   │   ├── (app)/            # Authenticated route group (dashboard, admin, portal, onboarding)
│   │   ├── api/              # API routes and server endpoints
│   │   ├── legal/            # Legal / privacy / terms pages
│   │   ├── listings/         # Public listings pages
│   │   ├── reserve/          # Reservation flow
│   │   ├── tenant-required/  # Tenant gating flow
│   │   ├── page.tsx          # Homepage
│   │   ├── layout.tsx        # Root app layout
│   │   ├── globals.css       # Global styles
│   │   └── ...
│   ├── features/             # Domain modules: admin, maintenance, lease, property, renter, tenant, etc.
│   ├── lib/                  # Auth, API, RBAC, config, utilities
│   ├── providers/            # Query provider, theme provider, app-wide providers
│   ├── shared/               # Shared components and UI blocks
│   ├── stores/               # Zustand stores
│   ├── types/                # Type definitions
│   ├── proxy.ts              # Route-level RBAC proxy / middleware equivalent
│   └── ...
├── public/                   # Static assets, icons, OG assets, favicons
├── scripts/                  # Dev/deployment utilities
├── .env.example              # Frontend environment template
├── src/lib/config/.env.example # Additional config template for app-specific runtime values
├── Dockerfile                # Container build config
├── netlify.toml              # Netlify deployment config
├── next.config.ts            # Next.js config
├── open-next.config.ts       # OpenNext config for Cloudflare/Workers deployments
├── wrangler.jsonc            # Cloudflare deployment config
├── tailwind.config.js        # Tailwind config
├── vitest.config.ts          # Vitest config
├── eslint.config.mjs         # ESLint config
├── package.json              # Scripts and dependency manifest
├── tsconfig.json             # TypeScript config
├── postcss.config.js         # PostCSS config
├── LICENSE                   # Repository license
├── README.md                 # Project documentation
└── ...
```

## Core application flows

- Public marketing and listings: rendered outside the authenticated route group.
- Authenticated shell: `src/app/(app)/layout.tsx` wraps the app with Clerk authentication providers.
- Route access: `src/proxy.ts` handles requests before rendering, applying route policies and signed-out redirect behavior.
- API communication: the frontend expects a backend API base URL with `/api/v1` suffix and builds typed request paths from that base.
- Monitoring: Sentry can be enabled for client-side error monitoring via `NEXT_PUBLIC_SENTRY_DSN`.

## Prerequisites

Before running locally, make sure you have:

- Node.js 18+ (LTS recommended)
- npm
- A running backend API instance that exposes the expected endpoints
- A valid Clerk account and project with a publishable key and secret
- Optional: Stripe keys if you are testing billing-related flows
- Optional: Sentry DSN if you want monitoring enabled

## Environment variables

Copy the sample environment file before starting development:

```bash
cp .env.example .env.local
```

The project enforces validation on startup. Required and optional values are defined in `.env.example` and `src/lib/config/validation.ts`.

### Required values

- `NEXT_PUBLIC_APP_NAME` — app display name, e.g. `RentManager`
- `NEXT_PUBLIC_APP_ENV` — one of `development`, `test`, `production`
- `NEXT_PUBLIC_API_URL` — base API URL, must include `/api/v1`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk public key
- `CLERK_SECRET_KEY` — Clerk server secret

### Common optional values

- `NEXT_PUBLIC_APP_URL` — canonical app URL used for metadata and canonical links
- `NEXT_PUBLIC_APP_VERSION` — app version string
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `STRIPE_SECRET_KEY` — Stripe secret for server-side billing flows
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook secret
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry client DSN
- `NEXT_PUBLIC_LEGAL_CONTACT_EMAIL` — privacy/legal contact email
- `CLERK_WEBHOOK_SIGNING_SECRET` — required if webhooks are used
- `ENABLE_PREMIUM_FEATURES` — set to `true` to enable premium functionality

Important: `NEXT_PUBLIC_API_URL` must include the `/api/v1` suffix. This is required by the client structure and is validated at startup.

## Local development

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Open the app in your browser:

```text
http://localhost:3000
```

## Production build

Build the app:

```bash
npm run build
```

Run the production server:

```bash
npm start
```

This repository contains multiple deployment targets, including OpenNext/Cloudflare, Docker, and Netlify configs. Choose the hosting model that matches your deployment environment and populate the required secrets in the host or CI provider.

## Scripts

The project scripts are defined in `package.json`:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
```

## Testing

The repository includes Vitest and a lint configuration.

Run tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

Playwright is present in the `devDependencies`, suggesting e2e coverage may be used in the project as it evolves.

## API and backend integration

This frontend expects an API backend with the shape used by the RentManager platform. A few important notes:

- The API base is configured through `NEXT_PUBLIC_API_URL`.
- The frontend uses OpenAPI-driven patterns and typed API generation tooling.
- Route decisions rely on backend-backed JWT claims and session metadata, especially for admin and tenant-specific paths.
- For protected routes, client-side restrictions are not sufficient by themselves; server-side auth remains the source of truth.

If the backend contract changes, regenerate the API client and re-run validation before merging.

## Security notes

- Never commit secrets to the repository.
- Keep `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, webhook secrets, and backend tokens in your secret manager or hosting environment.
- Only public values should be placed in `NEXT_PUBLIC_*` variables.
- The route RBAC proxy is a defense-in-depth layer; important authorization checks must still exist in backend endpoints.

## Contributing

Please keep changes focused and reviewable. Before opening a PR:

- keep branches small and descriptive
- run tests and lint locally
- verify environment variables and deployment assumptions
- document any contract changes with the backend team
- include screenshots or a brief demo when altering UI flows

## Troubleshooting

If you hit issues during local development, check the following:

- API requests fail with 404s: confirm `NEXT_PUBLIC_API_URL` ends with `/api/v1`.
- Clerk redirect issues: verify your publishable key and session settings; ensure sign-in pages are configured correctly.
- Redirects show `http://` instead of `https://`: confirm the public origin and hosting forward-proto settings.
- Missing env values: every required value is validated at startup, so the app will fail early with a clear message when configuration is incomplete.

## License

This project includes a LICENSE file at the repository root. Please review it before redistribution or commercial use.

## Recommended next reads

- `src/proxy.ts` — route-level RBAC enforcement
- `src/app/(app)/layout.tsx` — authenticated route boundary
- `src/lib/config/validation.ts` — environment validation rules
- `src/app/layout.tsx` — top-level providers and metadata
- `src/lib/rbac/route-policy.ts` — central access policy logic

## Summary

RentManager Frontend is a production-oriented, authenticated web application for property management. It combines a strong Next.js app architecture, Clerk RBAC, tenant/landlord/admin personas, and a deployment-ready configuration for real hosting environments. The project is structured for maintainability and is designed to work alongside a backend API rather than as a standalone application.
