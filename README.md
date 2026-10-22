# RentManager Frontend

<p align="center">
  <a href="https://rentmanager-frontend.vercel.app" target="_blank">
    <img src="assets/hero-banner.svg" alt="RentManager Hero Banner" width="100%" max-width="1200px" />
  </a>
</p>

<p align="center">
  <a href="https://rentmanager-frontend.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-rentmanager.vercel.app-blue?style=for-the-badge" alt="Live Demo" />
  </a>
  <a href="https://github.com/hassan200503/rentmanager-frontend/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/hassan200503/rentmanager-frontend?style=for-the-badge" alt="License" />
  </a>
  <a href="https://github.com/hassan200503/rentmanager-frontend/commits/main">
    <img src="https://img.shields.io/github/last-commit/hassan200503/rentmanager-frontend?style=for-the-badge" alt="Last Commit" />
  </a>
  <a href="https://github.com/hassan200503/rentmanager-frontend/issues">
    <img src="https://img.shields.io/github/issues/hassan200503/rentmanager-frontend?style=for-the-badge" alt="Issues" />
  </a>
  <a href="https://github.com/hassan200503/rentmanager-frontend/stargazers">
    <img src="https://img.shields.io/github/stars/hassan200503/rentmanager-frontend?style=for-the-badge" alt="Stars" />
  </a>
  <a href="https://github.com/hassan200503/rentmanager-frontend/network/members">
    <img src="https://img.shields.io/github/forks/hassan200503/rentmanager-frontend?style=for-the-badge" alt="Forks" />
  </a>
</p>

RentManager Frontend is a production-grade property management platform built for the Kenyan rental market. It brings together landlord operations, renter workflows, and operational tooling in a single product experience designed for local realities: digital rent collection, maintenance tracking, lease visibility, and platform oversight.

This repository is a portfolio-grade example of how I approach product engineering: strong frontend architecture, secure auth flows, deployment-minded configuration, and product thinking grounded in real user needs. It is designed to demonstrate full-stack product judgment, not just UI implementation.

---

## Recruiter quick read

- Full-stack product engineer with a focus on Next.js, TypeScript, SaaS architecture, and secure frontend systems
- Builds production-minded digital products for real-world markets, not only demos
- Strong emphasis on performance, user flows, authorization, validation, and deployment readiness
- Open to remote, hybrid, contract, freelance, and full-time opportunities
- Experienced in building business-critical interfaces with strong product thinking and maintainable architecture

---

## Why this project exists

RentManager addresses a real operational problem in the Kenyan property ecosystem: landlords and renters often deal with fragmented systems for payments, maintenance, communications, and records. The product brings these workflows into a unified platform, with a strong emphasis on local payment behavior, ledger clarity, and trust-building features.

This project is intentionally aligned with a real-world business context:

- property management needs clear operations and visibility
- landlords need recurring rent flows and account oversight
- renters need transparent access and predictable communication
- businesses need a product ready to be extended into a revenue-generating SaaS

The frontend is designed to serve as a credible case study for full-stack product engineering and SaaS delivery.

---

## Product overview

RentManager is built for four primary user groups:

- Landlords — manage rent collection, occupancy, leases, maintenance, and overview reporting
- Renters — pay rent, report issues, access lease details, and stay informed
- Admins — manage platform operations and user/tenant oversight
- Public visitors — browse listings, learn about the platform, and discover the product

The platform is designed to be efficient, trustworthy, and deployment-ready for a real user base.

---

## Business value and market fit

This product is not just a UI showcase. It is built around clear value creation:

- improves rent collection efficiency for landlords
- reduces communication gaps between renters and property managers
- gives property operators a clear operational dashboard
- supports local payment habits through M-Pesa-first experiences
- creates a SaaS-ready foundation for subscriptions, transaction fees, and premium features

The product positions itself around the Kenyan market, where local payment methods, regulatory awareness, and operational realities matter. That makes the work stronger from both a business and engineering perspective.

---

## Screenshots

<p align="center">
  <img src="assets/landlord-dashboard.svg" alt="Landlord Dashboard" width="48%" />
  <img src="assets/renter-portal.svg" alt="Renter Portal" width="48%" />
</p>

<p align="center">
  <img src="assets/admin-panel.svg" alt="Admin Panel" width="48%" />
  <img src="assets/architecture-diagram.svg" alt="Architecture" width="48%" />
</p>

---

## Tech stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | Scalable app architecture and product delivery |
| Language | TypeScript 5 | Strong typing, safer product changes, easier maintainability |
| Styling | Tailwind CSS v4 + PostCSS | Fast UI iteration and design consistency |
| Authentication | Clerk (@clerk/nextjs) | Secure auth patterns and session handling |
| Data & Caching | @tanstack/react-query | Client/server data orchestration |
| Forms | react-hook-form + zod | Structured validation and UX safety |
| State | zustand | Lightweight frontend state management |
| Charts & Visualization | recharts, three.js + @react-three/* | Analytics and visual product storytelling |
| Motion | framer-motion, gsap, lenis | Smooth product experiences |
| Notifications | sonner | User feedback and status messaging |
| Testing | vitest, Playwright | Automated quality and confidence |
| Deployment | Docker, Netlify, Cloudflare/OpenNext, Node | Production readiness across deployment targets |

---

## Architecture at a glance

<img src="assets/architecture-diagram.svg" alt="System Architecture" width="600" />

- `src/app/layout.tsx` — global providers, metadata, and app composition
- `src/app/(app)/layout.tsx` — authenticated route boundary with Clerk providers
- `src/proxy.ts` — route-level RBAC enforcement as a defense-in-depth layer
- `src/lib/rbac/route-policy.ts` — authorization policy logic
- `src/lib/config/validation.ts` — fail-fast validation for environment/runtime configuration
- `src/features/*` — domain feature modules organized for product scale and maintainability
- `src/shared/` — reusable UI building blocks and consistent product patterns

This structure is designed to support real-world product complexity: security, maintainability, performance, and clean ownership boundaries.

---

## What I prioritized as an engineer

This project demonstrates engineering practices that matter in production work:

- clear product boundaries and domain organization
- typed frontend contracts and safer evolution
- environment validation before app startup
- route-level authorization guardrails
- deployment flexibility for real hosting providers
- CI checks for correctness before shipping
- a product view shaped around real business and user value

These are the kinds of decisions that matter when building products for hiring managers, teams, or clients.

---

## Repository layout

```text
rentmanager-frontend/
├── LICENSE                          # MIT License
├── SECURITY.md                      # Responsible disclosure policy
├── CONTRIBUTING.md                  # Contribution workflow
├── README.md                        # Project overview and hiring-facing documentation
├── .env.example                     # Environment variables template
├── .github/workflows/ci.yml         # CI pipeline for lint, tests, typecheck, and build
├── assets/                          # Visual assets for marketing and product storytelling
├── Dockerfile                       # Container deployment setup
├── netlify.toml                     # Netlify deployment config
├── wrangler.jsonc                   # Cloudflare/OpenNext deployment config
├── open-next.config.ts              # OpenNext configuration
├── tsconfig.json                    # TypeScript configuration
├── vitest.config.ts                 # Vitest configuration
├── src/
│   ├── app/                         # Next.js App Router
│   ├── features/                    # Domain feature modules
│   ├── providers/                   # App and query providers
│   ├── lib/                         # Auth, RBAC, validation, API utilities
│   └── shared/                      # Shared UI and reusable patterns
├── public/                          # Static assets
└── .github/                         # GitHub automation and workflows
```

---

## Quick start

### Prerequisites

- Node.js 20+
- npm or pnpm
- Clerk account
- a backend API or local mock service

### Install and run

```bash
git clone https://github.com/hassan200503/rentmanager-frontend.git
cd rentmanager-frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 to view the app.

---

## Environment variables

See `.env.example` for the full configuration list. The critical values are:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | API origin; should include `/api/v1` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ Yes | Clerk public key |
| `CLERK_SECRET_KEY` | ✅ Yes | Clerk secret key, server-side only |
| `NEXT_PUBLIC_APP_URL` | ⚠️ Recommended | Public application URL |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ Optional | Error monitoring |

> `NEXT_PUBLIC_*` values are public at build time. Keep secrets in your hosting provider’s secret manager or CI environment.

---

## Deployment

This project is configured for multiple production-ready deployment targets:

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hassan200503/rentmanager-frontend)

### Docker

```bash
docker build -t rentmanager-frontend .
docker run -p 3000:3000 --env-file .env.production rentmanager-frontend
```

### Netlify

```bash
netlify deploy --prod
```

### Cloudflare / OpenNext

```bash
npx open-next@latest deploy
```

---

## Testing and CI

| Command | Purpose |
|---------|---------|
| `npm test` | Run unit tests |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Validate TypeScript correctness |
| `npm run build` | Validate production build |

GitHub Actions runs checks on pushes and pull requests to keep quality high and reduce regressions before release.

---

## Security and production safety

This project is structured with key production-minded practices:

- runtime environment validation via Zod
- authorization guardrails with route-level RBAC
- secrets kept out of client-side/public exposure
- clear deployment config for hosting and runtime consistency
- standard CI checks for build health and quality

See [`SECURITY.md`](SECURITY.md) for the responsible disclosure policy.

---

## Contributing

We welcome thoughtful improvements, product ideas, and engineering discussions.

Before opening a PR:

- run `npx tsc --noEmit`
- run `npm test`
- run `npm run lint`
- include testing steps and screenshots for UI changes

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for contributor details.

---

## Availability and work preferences

I am open to opportunities across:

- remote roles
- hybrid roles
- contract and freelance work
- full-time product engineering roles
- SaaS, fintech, proptech, and product-led application work

I am especially interested in building meaningful products that combine engineering quality, real user value, and scalable architecture.

---

## Work with me

I build production-ready web products with a focus on:

- Next.js and TypeScript
- product architecture and frontend engineering
- secure, scalable user flows
- SaaS and business-focused product logic
- deployment-conscious engineering decisions

You can reach out via:

- GitHub: https://github.com/hassan200503
- Portfolio / project site: https://www.rentmanagerke.workers.dev

---

## Built for Kenya

RentManager is designed for the Kenyan property market and local realities:

- M-Pesa-first payment flows
- KES-based financial context
- Kenyan user and operational requirements
- local product fit and market relevance
- deployment choices suited for regional and cloud-native delivery

---

## Licensing

MIT — see [`LICENSE`](LICENSE) for the full license text.

---

<p align="center">
  <b>RentManager — Property Management for the Kenyan Rental Market</b><br />
  Built with ❤️ in Kenya 🇰🇪
</p>
