# Deploying the web app — Cloudflare Workers (free, no card)

Live at **https://www.rentmanagerke.workers.dev**.

Cloudflare is the third host this app has lived on in a week. The two before
it failed for opposite reasons, and both are worth remembering because the
failure modes are invisible until they bite.

| Host | Why it ended |
|---|---|
| **Netlify** | Meters deploys in credits: 300/month, 15 per production deploy. 17 deploys used 255 of them and the site was **suspended**. Traffic was never the issue — 9,051 web requests cost 1.8 credits. |
| **Deno Deploy** | An *unverified* organisation gets **1% of the free plan**: 10k requests, 0.2 CPU-hours, 1 GiB egress. Lifting it needs a card. Builds, not visitors, consumed 90% of the month's CPU in a single day, and the site stopped serving. |
| **Cloudflare** | Current. No credit system, no card, and static assets are free, unlimited and do not invoke the Worker. |

## The limit that was wrong for months

Cloudflare was rejected earlier against a **"3 MiB compressed Worker"** ceiling.
That ceiling no longer exists. The limit is **64 MiB uncompressed, with no
compressed limit at all**, and this app measures about **21.9 MiB** — it fits
with room to spare. A careful measurement against a stale limit still gives a
wrong answer; re-check a limit before using it to rule an option out.

The limit that *does* apply is **10 ms of CPU per Worker invocation** on the
free plan. It has not bitten, because most of the site is prerendered and
"requests to static assets are free and unlimited" without invoking the Worker
at all. If it ever does bite, the lever is the proxy matcher in `src/proxy.ts`.

## How it deploys

Cloudflare Workers Builds is connected to `hassan200503/rentmanager-frontend`
and builds on every push to `main`. **No API token exists anywhere** —
Cloudflare mints its own build token. There is nothing in GitHub secrets for
this path.

| Setting | Value |
|---|---|
| Project / Worker name | `www` |
| Account subdomain | `rentmanagerke.workers.dev` |
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

The URL is `<worker>.<account subdomain>.workers.dev`. The worker is named
`www` rather than `rentmanagerke` precisely because the subdomain already
carries the brand — naming it `rentmanagerke` would have produced
`rentmanagerke.rentmanagerke.workers.dev`.

`.workers.dev` cannot be removed. It is Cloudflare's domain, not ours. Only a
domain you own replaces it, and Cloudflare attaches custom domains **free**,
which Deno reserved for paid plans.

## Build variables

Set in the dashboard, not in the repo. These are **build-time** variables:
`NEXT_PUBLIC_*` values are inlined into the client bundle, so changing one
requires a **rebuild**, not just a save.

| Variable | Value |
|---|---|
| `BACKEND_URL` | `https://rentmanager-api-2reb.onrender.com` |
| `NEXT_PUBLIC_API_URL` | `https://www.rentmanagerke.workers.dev/api/v1` |
| `NEXT_PUBLIC_APP_URL` | `https://www.rentmanagerke.workers.dev` |
| `NEXT_PUBLIC_APP_ENV` | `production` |
| `NEXT_PUBLIC_APP_NAME` | `RentManager` |
| `NEXT_PUBLIC_LEGAL_CONTACT_EMAIL` | `rentmanagerke2026@gmail.com` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | the real `pk_test_…` — see the trap below |

`NEXT_PUBLIC_API_URL` points at the site's **own** `/api/v1`, which
`next.config.ts` rewrites to `BACKEND_URL`. That keeps the browser same-origin
and the CSP at `connect-src 'self'`.

## Runtime variables — a different list, and the trap that cost a day

`CLERK_SECRET_KEY` is a **runtime secret**, set under *Runtime variables and
secrets*. It is not a build variable, and the two lists are separate.

Deploying with it missing does not break sign-in — it breaks **everything**.
Clerk's middleware runs on every matched route and throws
`throwMissingSecretKeyError`, so the landing page, the listings and the privacy
policy all returned 500 while `/robots.txt` and `/og.png` served fine. That
split — exactly along the proxy matcher — is how the cause was identified.

`src/proxy.ts` now answers public paths before Clerk sees them, so this can no
longer take down pages that own no authentication. Sign-in itself still needs
the key.

### The publishable key is inlined, so a placeholder survives a save

A correctly *shaped* but fake publishable key lets the build pass and the site
serve, and then sign-in silently cannot work: the key is
`pk_(test|live)_` + base64 of the Clerk host, and `next.config.ts` decodes it
to build the CSP. A placeholder decoding to `clerk.example.com` produced a CSP
allowing `https://clerk.example.com` and nothing pointing at the real instance.

Symptom: sign-in and sign-up do nothing. Diagnosis in one command:

```bash
curl -s https://www.rentmanagerke.workers.dev/public/sign-in \
  | grep -oE "pk_(test|live)_[A-Za-z0-9+/=_-]+" | sort -u
```

Decode it to see which Clerk instance the live site is really talking to:

```bash
echo "<the key minus its pk_test_ prefix>" | base64 -d
```

The real instance is `social-monitor-54.clerk.accounts.dev`.

## Verify after deploying

```bash
SITE=https://www.rentmanagerke.workers.dev
for p in / /listings /legal/privacy /icon /robots.txt; do
  printf "%-16s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "$SITE$p"
done
for p in /dashboard /portal /admin; do
  printf "%-12s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "$SITE$p"   # expect 307
done
curl -s "$SITE/api/v1/public/platform/branding" | head -c 120   # proves the rewrite
```

Public routes must be 200, gated routes 307 to `/public/sign-in` **over https**
(if they redirect to `http://`, the forwarded-proto handling in
`src/lib/auth/forwarded-proto.ts` has regressed).

## Things that are not Cloudflare's fault but look like it

- **No filesystem.** `fs/promises` throws. `/icon` used to read its fallback
  SVG from `public/` and returned 500 on every request until it was inlined.
- **Render sleeps.** The API spins down after 15 minutes idle and the first
  request afterwards took 38.7 s, during which the `/api/v1` rewrite answers
  "Internal Server Error". See `rentmanager-backend/deploy/FREE_NO_CARD.md`
  and the `keep-awake` workflow.

## Netlify and Deno

Both still exist and both are disconnected from this repo. Netlify's credits
reset on the 15th of each month if it is ever needed again; Deno's app can be
deleted, since nothing depends on it.
