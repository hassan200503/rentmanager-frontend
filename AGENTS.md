<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Backend test command
- Run specific test: `mvn test -f "C:\JavaProjects\rentmanager-backend" -Dtest="ClassName" -pl .`
- Run full suite: `mvn test -f "C:\JavaProjects\rentmanager-backend" -pl .`
- Status (2026-09-04): full suite is green — 1,445 tests, 0 failures, 0 errors. Treat any new failure as caused by your change.

# Test conventions for new tests
- Do NOT use `@Mock`/`@InjectMocks`/`@ExtendWith(MockitoExtension.class)` or `@Nested` — Mockito's strict stubbing causes `UnnecessaryStubbingException` when tests override shared `@BeforeEach` stubs.
- Use manual `mock(Class.class)` construction with `@BeforeEach` only setting up repo mocks (no stubbing). Each test method creates its own domain mocks AND stubs.
- Never call `mockXxx()` helper methods inside `when(...).thenReturn(...)` arguments — this causes `UnfinishedStubbingException`. Create all domain mocks first, then set up stubbings.
<!-- END:nextjs-agent-rules -->

# RentManager — frontend context

Next.js 16 App Router, React 19, TypeScript, React Query, Clerk. All business
logic is in the Spring Boot backend; this app is a client. Feature-sliced under
`src/features/<feature>/{api,components,hooks,queries,types}`.

## Naming trap

`tenant` in this codebase means the **landlord organisation**, not the renter.
The renter is the "renter"/"tenant profile" and lives under `/portal`.
`tenantId` in an API call is the landlord org. Read it that way every time.

## Auth and routing

- `src/proxy.ts` (Next 16's renamed middleware) runs `resolveRoutePolicy` from
  `src/lib/rbac/route-policy.ts` — pure, unit-tested, fail-closed. Personas:
  `admin` → `/admin`, `landlord` → `/dashboard`, `renter` → `/portal`,
  `landlord_pending` → `/onboarding`.
- The proxy and the layouts are **defence in depth only**. The backend is the
  authority. Never gate data on a client check.
- `X-Tenant-Id` is sent by `lib/api/interceptor.ts` but the backend ignores it
  entirely — tenant comes from the verified JWT there. Do not build anything
  that assumes the header is trusted.
- `route-policy.ts` currently lets an unresolved persona (`null`) into
  `/portal` as a migration-window measure. That is a deliberate fail-open and
  should be closed once every user carries a `userType` claim.

## Known defects

**Defects 1-7 and 9 from the original list are FIXED (2026-09-02).** Do not
re-fix them; the detail and reasoning live in `docs/ai/TECHNICAL_DEBT.md` and
`docs/ai/DECISION_LOG.md`, which are the current source of truth for this
list.

Summary of what changed, because several fixes are easy to undo by accident:

- **`FinancialOverview`** now reads `GET /rent-ledger/summary`. It shows three
  figures the ledger can actually produce and **no trend arrows** — there is no
  time series behind them.
- **Portfolio Health is gone.** It was a hand-weighted formula. `HealthScore.tsx`
  was deleted with it.
- **Occupancy is unit-based**, from `GET /units/summary`, counted in SQL.
  Per-property counts come from `GET /units/occupancy-by-property`.
- **`PropertyRanking`** no longer derives a percentage from the property name's
  character codes. It shows real occupied/total counts and orders by
  vacancies-first.
- **`lib/mpesa/matching-engine.ts` is deleted.**
- **`InsightsEngine`** no longer claims occupancy "dropped".
- **Money is `MoneyValue` (string | number)** on renter response types. The
  backend serialises every `BigDecimal` as a JSON string; declaring these
  `number` let `totalPaid + totalDue` type-check and concatenate at runtime.
  *Request* types stay `number` on purpose.
- **`tenantScoped` is deleted** from `lib/api/endpoints.ts`.
- **`react-redux` is removed.** React Query and Zustand remain, both used.
- **`UnitMediaController`/`PropertyMediaController`/`PropertyMediaQueryController`**
  now have `@PreAuthorize` (TD-112), and STAFF is read-only on media on the
  frontend too (TD-114, ADR-0013) — `UnitMediaManager`/`PropertyMediaManager`
  hide upload/delete/set-primary for STAFF via `useHasRole(WRITE_ROLES)` from
  `features/user/hooks/use-has-role.ts`. That hook, plus `WRITE_ROLES` from
  `features/user/lib/roles.ts` and `<RequireRole>` from
  `features/user/components/require-role.tsx`, are the reusable pattern for
  hiding a write control a role can't use — reach for these instead of a new
  ad hoc `isOwner`/`canX` boolean. `PropertyCommandController`'s equivalent
  frontend gap is still unfixed (its buttons are still shown unconditionally
  to STAFF); it should reuse `WRITE_ROLES` when it's picked up.

Still open, and why:

1. **The landing page still loads gsap eagerly (~107 KB at `scrollY: 0`)**,
   via `HowItWorksSection`. The three.js map (~2.4 MB in production chunks) is
   already deferred behind an IntersectionObserver and skipped under
   `save-data`. Deferring gsap too would change an animation — that is a
   product call.

2. **Test coverage is thin** — 95 tests across ~500 source files. Money and
   access-control paths first; coverage percentage is not the goal.

## How money actually moves (read before touching any payment UI)

**Rent and reservation deposits both settle into the landlord's own M-Pesa.
The platform never holds either.** Payments are signed with that landlord's
own Daraja credentials — the ones configured on **Payment settings**
(`/daraja/config`) — and land in their own Till or Paybill. RentManager
records the payment and receives nothing.

This is `CollectionMode.DIRECT` (`tenants.collection_mode`, `V89`), the
default for every landlord. It is what keeps the platform out of PSP
licensing: holding the money is what triggers it. See ADR-0026 and the
artifact *Rent Without Custody*.

`PLATFORM_CUSTODY` is the legacy alternative — rent lands in the platform
paybill, commission is deducted, the net is disbursed by B2C. It **requires
CBK authorisation and Safaricom's written consent** before use with real
money, is never the default, and must be set deliberately per landlord.

Consequences for UI work:

- The credentials card is the **primary** money path, not a deposit-only one.
- The **payout number is only meaningful under `PLATFORM_CUSTODY`.** Do not
  write copy implying a direct landlord needs one, or that rent is stuck
  without it — under DIRECT there is nothing to pay out. This was wrong once
  and was fixed; do not reintroduce it.
- `GET /tenants/{id}/daraja-credentials/status` returns `collectionMode`.
  Use it rather than describing the default, and treat a missing value as
  `DIRECT` — that is both the default and the only safe claim.
- **Test connection** (`POST .../daraja-credentials/test`) verifies the
  Consumer Key and Secret against Safaricom. It does *not* verify the
  Shortcode or Passkey; say so wherever a result is shown.

Whether the `PLATFORM_CUSTODY` model is worth licensing is a business
decision — see `docs/ai/TECHNICAL_DEBT.md` TD-120 and
`docs/ai/PRODUCTION_CHECKLIST.md` §1.

## Rules

- Prices come from the backend catalogue. Never hard-code a price except in
  `FALLBACK_LANDLORD_PLANS`, and keep that in step with `V50`.
- No claim on a public page that you cannot trace to working code.
- Every list needs loading, empty and error states.
- `next build` runs ESLint — an unused import or variable fails the build.
