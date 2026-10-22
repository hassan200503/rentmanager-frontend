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

RentManager Frontend is the web client for a production-grade property management platform built for the Kenyan rental market. It gives landlords, renters, and administrators a single experience for listings, rent collection, maintenance orchestration, and reporting.

This repository uses Next.js with TypeScript, Clerk for authentication, route-level RBAC, and typed API contracts. The architecture is designed to keep public pages fast while protecting authenticated flows behind strict authorization and environment validation.

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

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | Production React framework |
| Language | TypeScript 5 | End-to-end type safety |
| Styling | Tailwind CSS v4 + PostCSS | Utility-first UI system |
| Authentication | Clerk (@clerk/nextjs) | Secure sessions and role-based access |
| Data & Caching | @tanstack/react-query | Server state management |
| Forms | react-hook-form + zod | Validation and form handling |
| State | zustand | Lightweight client state |
| Charts | recharts, three.js + @react-three/* | Visual analytics and rendering |
| Motion | framer-motion, gsap, lenis | Smooth animation and scroll experiences |
| Notifications | sonner | Toast notifications |
| Testing | vitest, Playwright | Unit and end-to-end validation |
| Deployment | Docker, Netlify, Cloudflare/OpenNext, Node | Multi-platform deployment |

---

## Architecture at a Glance

<img src="assets/architecture-diagram.svg" alt="System Architecture" width="600" />

- `src/app/layout.tsx` — global providers and metadata composition
- `src/app/(app)/layout.tsx` — authenticated route boundary with Clerk providers
- `src/proxy.ts` — route-level RBAC proxy for access control
- `src/lib/rbac/route-policy.ts` — authorization policy definitions
- `src/lib/config/validation.ts` — Zod-based runtime validation for environment values
- `src/features/*` — domain modules for landlord, renter, admin, and property flows
- `src/shared/` — reusable UI components and shared patterns

This design enforces performance, security, and maintainability across the product.

---

## Repository Layout

```text
rentmanager-frontend/
├── LICENSE                          # MIT License
├── SECURITY.md                      # Responsible disclosure policy
├── CONTRIBUTING.md                  # Contributor workflow
├── README.md                        # Project overview and onboarding
├── .env.example                     # Environment variables template
├── .github/workflows/ci.yml         # CI pipeline
├── assets/                          # Visual assets used in docs
├── Dockerfile                       # Container deployment
├── netlify.toml                     # Netlify configuration
├── wrangler.jsonc                   # Cloudflare/OpenNext config
├── open-next.config.ts              # OpenNext configuration
├── tailwind.config.js               # Tailwind config
├── tsconfig.json                    # TypeScript config
├── vitest.config.ts                 # Vitest configuration
├── src/
│   ├── app/                         # Next.js App Router
│   ├── features/                    # Feature modules
│   ├── providers/                   # Query, theme, and app providers
│   ├── lib/                         # Auth, RBAC, config, and utilities
│   └── shared/                      # Shared UI components
├── public/                          # Static assets
└── .github/                         # Repository automation and workflows
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm
- A Clerk account for auth
- A backend API or development mock

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

## Environment Variables

See `.env.example` for the full list. The most important values are:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Base API origin, must include `/api/v1` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | ✅ Yes | Clerk secret key (server side only) |
| `NEXT_PUBLIC_APP_URL` | ⚠️ Recommended | Public URL for redirect and callback flows |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ Optional | Error monitoring via Sentry |

> `NEXT_PUBLIC_*` variables are public at build-time. Keep secrets in your hosting provider or CI secret manager.

---

## Deployment Options

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

## Testing & CI

| Command | Purpose |
|---------|---------|
| `npm test` | Run unit tests with Vitest |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | TypeScript validation |
| `npm run build` | Production build |

GitHub Actions runs the same checks on pushes and pull requests.

---

## Security Notes

- Do not commit secrets or credentials.
- Keep `CLERK_SECRET_KEY`, webhook secrets, and other sensitive values in your secret manager.
- `src/proxy.ts` enforces RBAC as a defense-in-depth layer, but the backend remains the source of truth for authorization.
- Runtime configuration is validated at startup to catch bad deployments early.

See [`SECURITY.md`](SECURITY.md) for responsible disclosure guidance.

---

## Contributing & Recruiter Guidance

This repository is structured to be easy to understand, maintain, and present to employers or collaborators.

Before opening a PR:

- Run `npx tsc --noEmit`
- Run `npm test` and `npm run lint`
- Include a short summary, testing steps, and screenshots for visual changes

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full workflow.

---

## Monetization & Pricing

RentManager is designed as a SaaS product for the Kenyan market.

### Pricing Tiers (KES)

| Tier | Price/Month | Properties | Features |
|------|------------|------------|----------|
| Free | KES 0 | 1 | Basic dashboard and rent tracking |
| Starter | KES 2,999 | Up to 5 | M-Pesa integration, digital receipts |
| Pro | KES 7,999 | Unlimited | Maintenance tracking, reports, admin dashboard |
| Enterprise | Custom | Unlimited | White-label, SLA, custom integrations |

### Revenue Opportunities

- Subscription fees for landlords and property managers
- Transaction fees on M-Pesa payments
- Premium feature upsells
- Custom development for property groups and agencies

---

## Built for Kenya

RentManager is designed around local market realities:

- M-Pesa STK push flows for rent collection
- KES currency formatting throughout the UI
- Kenyan ID and KRA PIN fields where relevant
- County compliance considerations for local operations
- Deployment choices optimized for low-latency regional access

---

## Hire Me / Work With Me

I build production-grade SaaS platforms with a strong focus on Next.js, TypeScript, and product architecture.

Available for:

- Full-time engineering roles
- Contract and freelance work
- SaaS product development
- AI-enabled product and workflow automation

Contact:

- GitHub: https://github.com/hassan200503
- Portfolio: https://github.com/hassan200503

---

## License

MIT — see [`LICENSE`](LICENSE) for the full text.

---

<p align="center">
  <b>RentManager — Property Management for the Kenyan Rental Market</b><br />
  Built with ❤️ in Kenya 🇰🇪
</p>
