# Deploying the web app to Deno Deploy (free)

Netlify suspended this site on 28 September when its credit allowance ran out.
That plan is metered in credits — 300 a month, 15 per production deploy — and
running out takes the site **offline** rather than merely blocking builds.

Deno Deploy is the replacement, chosen after measuring the alternatives rather
than guessing:

| Host | Verdict |
|---|---|
| **Deno Deploy** | **First-class Next.js support, 1 GiB size limit, no credit system.** Chosen. |
| Cloudflare Workers | Built Worker measured at **4.73 MiB gzipped against a 3 MiB free ceiling**. Rejected. |
| Cloudflare Pages (static) | Needs `generateStaticParams` for 11 dynamic segments, including per-tenant ids unknowable at build. Rejected. |
| Vercel Hobby | Commercial use prohibited — "taking payments" is named explicitly. Rejected. |
| Render (second service) | 750 instance-hours are per *workspace* and the API already uses ~730. Rejected. |
| Koyeb | No longer offers a free web tier. Rejected. |

## What the free plan gives you

1M requests, 20 GiB egress, 10 hours of active CPU, 150 GiB-hr memory, 10 apps,
1 GiB per deployment. Sign-in is with GitHub.

The size limit is the one that matters: this app builds to roughly **22 MiB**,
which is why Cloudflare's 3 MiB ceiling ruled it out and Deno Deploy's 1 GiB
does not.

## Steps

1. Go to [deno.com/deploy](https://deno.com/deploy) and sign in **with GitHub**.
2. Create an application and pick `hassan200503/rentmanager-frontend`, branch
   `main`. Next.js is detected automatically — no build command to configure.
3. Add the environment variables below.
4. Deploy, then update the two places that name the site's URL:
   - Render → `CORS_ALLOWED_ORIGINS` → the new Deno Deploy URL
   - Clerk → allowed origins, and the web webhook endpoint
     (`https://<new-url>/api/webhooks/clerk`)

## Environment variables

Copy the values from the Netlify dashboard (Site settings → Environment) before
they are lost, or from your local `.env.local`.

| Variable | Value |
|---|---|
| `BACKEND_URL` | `https://rentmanager-api-2reb.onrender.com` |
| `NEXT_PUBLIC_API_URL` | `https://<new-deno-url>/api/v1` |
| `NEXT_PUBLIC_APP_URL` | `https://<new-deno-url>` |
| `NEXT_PUBLIC_APP_ENV` | `production` |
| `NEXT_PUBLIC_APP_NAME` | `RentManager` |
| `NEXT_PUBLIC_LEGAL_CONTACT_EMAIL` | `rentmanagerke2026@gmail.com` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | from Clerk (secret-ish, paste directly) |
| `CLERK_SECRET_KEY` | from Clerk |
| `CLERK_WEBHOOK_SIGNING_SECRET` | from Clerk |

`NEXT_PUBLIC_API_URL` points at the **site's own** `/api/v1`, not at Render
directly: `next.config.ts` rewrites that path to `BACKEND_URL`, which keeps the
browser same-origin and the CSP at `connect-src 'self'`. Setting it to the
Render URL instead would work but would need CORS and a wider CSP.

`BACKEND_URL` is not optional — `next.config.ts` refuses a production build
without it rather than silently proxying to localhost.

## After deploying, verify

```bash
SITE=https://<new-deno-url>
curl -s -o /dev/null -w "landing %{http_code}\n" "$SITE/"
curl -s -o /dev/null -w "listings %{http_code}\n" "$SITE/listings"
curl -s -o /dev/null -w "privacy  %{http_code}\n" "$SITE/legal/privacy"
curl -s "$SITE/api/v1/public/platform/branding" | head -c 200   # proves the rewrite works
```

Then, signed out in a browser, confirm `/dashboard` redirects to sign-in and
that the reservation page shows the "Test environment — do not pay" banner
while M-PESA is still in sandbox.

## Keep Netlify around, disconnected

Do not delete the Netlify site. Its credits reset on 15 October, and having a
second host already configured is worth more than the tidiness of removing it —
just disconnect the repository so it stops building and consuming credits.
