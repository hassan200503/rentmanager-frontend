# Technical Debt Register

Every item below was verified against the source on the date shown, not
inferred from documentation. Items are removed when fixed, not when they
stop being mentioned.

Status key: OPEN · IN PROGRESS · RESOLVED

---

## RESOLVED — 2026-09-01/02

| ID | Description | Evidence it is fixed |
|----|-------------|----------------------|
| TD-001 | `FinancialOverview` was a hard-coded array rendering a green "+12%" beside "KES 0" | Now reads `GET /rent-ledger/summary`; 9 integration tests |
| TD-002 | Dashboard invented `portfolioHealthScore`; `healthBreakdown.collections` held no collections data; `revenue` was `occupancyRate + 10` | Deleted. `HealthScore.tsx` removed |
| TD-003 | Occupancy counted *properties* not units, and read one page | Now `GET /units/summary`, counted in SQL |
| TD-004 | `PropertyRanking` derived a percentage from the property name's character codes and ranked by it | Replaced with status-based "Needs attention" |
| TD-005 | `InsightsEngine` claimed "Occupancy dropped to X%" with no time series | Now "Occupancy is X%" |
| TD-006 | `lib/mpesa/matching-engine.ts` — Levenshtein unit matching, float money, wrong timezone | Deleted with its tests |
| TD-007 | Audit module persisted nothing (`// JPA implementation later`) | V86 + real repository; 7 integration tests |
| TD-008 | `SimpleRateLimiter` had no time window, non-atomic counter, no eviction | Replaced by `SlidingWindowRateLimiter` |
| TD-009 | `/actuator/health` permitted in SecurityConfig with no actuator dependency | Actuator added; probes verified returning 200 |
| TD-010 | `MDC traceId` read by `ErrorTrackingService`, set by nothing | `TraceIdFilter`; 10 tests |
| TD-012 | Disbursement retry replayed a stored recipient with no re-validation, and was unaudited | Guard + audit; 8 tests in `DisbursementRetryGuardTest` |
| TD-014 | Admin overview linked "failed payments" / "payments pending" to `/admin/payments`, a route that never existed | Endpoint + page + 10 RBAC tests; all admin dashboard hrefs now resolve |
| TD-013 | `payout_phone_number` was unsettable — no endpoint, no UI — while three paths required it | `PayoutDestinationController`; 10 RBAC tests |
| TD-011 | Relative `canonical` / `og:url` shipped because `metadataBase` was undefined | `appConfig.siteUrl` always absolute |

---

## Detail — resolved and open, by id

Most entries below are RESOLVED and kept for their reasoning; the genuinely
open items are listed together at the end of this file.

### TD-101 · RESOLVED 2026-09-02 — per-property unit counts
`GET /units/occupancy-by-property` counts occupied-over-total per property in
one grouped query. The dashboard's "Needs attention" panel now shows
"39 of 40 units occupied" from real data, falling back to the categorical
label when the counts have not loaded or a property has no units.

ARCHIVED units are excluded from both figures, matching
`PropertyOccupancyRollupListener` — otherwise a property could read "fully
occupied" beside counts that disagreed. Six integration tests against real
PostgreSQL, including cross-tenant isolation and the archived exclusion.

**Cost a context-load failure on the way.** The first version used a JPQL
constructor expression (`new PropertyUnitCounts(...)`); `COUNT`/`SUM` yield
`Long` while the record takes primitive `long`, and Hibernate validates that
at **startup**, not at the call site. It would have broken application boot,
not just this query. Replaced with raw grouped rows mapped in the adapter —
less elegant in the repository, but a read query should not be able to cost
you the whole application.

<details><summary>Original entry</summary>

**ORIGINAL — HIGH VALUE, LOW RISK**
**Verified:** `PropertyOccupancyRollupListener` computes `totalUnits` and
`occupiedUnits` per property and **discards both**, persisting only the
derived `OccupancyStatus` enum. `Property.unitCount` is a user-entered
*dimension*, not a live count.

**Impact:** No truthful per-property occupancy percentage is possible, which
is why the "Needs attention" panel is categorical rather than quantified.
"Sunset Apartments — 39/40 occupied" is what a landlord actually wants.

**Fix:** Read-side aggregate grouping units by property. No schema change, no
sync risk. **Trigger:** next time the dashboard analytics are touched.
</details>

### TD-102 · RESOLVED 2026-09-02 — renter money types declared `number`
**What was actually wrong.** The backend was already correct: `JacksonConfig`
serialises *every* `BigDecimal` as a JSON string, globally. The defect was on
the client — eight renter-facing response fields were declared `number` while
receiving `"15000.00"`.

**Why that mattered more than a type inaccuracy.** TypeScript would have
accepted `totalPaid + totalDue`, which at runtime concatenates: `"100"` plus
`"200"` is `"100200"`, silently, on a screen showing a renter what they owe.

**What was already right.** Every current use site coerces through
`toMoneyNumber()` before arithmetic, so nothing was broken at runtime —
`tsc` found zero breakages after the retype. The fix removes the trap rather
than a live bug.

**Fixed:** `monthlyRent`, `depositAmount`, `totalPaid`, `totalDue`,
`overdueAmount`, `nextDueAmount`, `amount`, `balanceAfter` and
`RentPaymentRequestResponse.amount` are now `MoneyValue`.

**Deliberately unchanged:** *request* types still use `number`
(`SetCommissionRateRequest`, `InitiateDisbursementRequest`, lease and unit
requests). Jackson deserialises a JSON number into `BigDecimal` correctly, and
Kenyan rent figures are exact in a double. The precision risk is one-way.

**Also verified already correct:** `DisbursementResponse.amount`,
`CommissionPolicy.ratePercent` and `LandlordCommission.ratePercent` were
typed `string` with the right comment.

### TD-103 · RESOLVED 2026-09-02 — `tenantScoped` builder removed
Produced `/tenants/{tenantId}/properties` under a comment claiming it
"ensures strict multi-tenant isolation" — the opposite of what a tenant id in
a URL path does. Imported by nothing. Deleted rather than deprecated so
autocomplete cannot revive it; only an explanatory comment remains in
`lib/api/endpoints.ts`.

### TD-104 · RESOLVED 2026-09-02 — `react-redux` removed
Declared, imported by nothing. Two state libraries remain, both used
(React Query, Zustand).

### TD-105 · RESOLVED 2026-09-07 — gsap deferred from the initial bundle

`HowItWorksSection` called `gsap.registerPlugin(ScrollTrigger)` at module
scope, so the static import pulled ~107 KB of gsap into the initial chunk
regardless of scroll position.

**Fixed:** `HowItWorksSection` is now a `next/dynamic` import (ssr: false)
wrapped in `DeferUntilNearViewport` (rootMargin: "400px 0px"), matching the
pattern already applied to the three.js map. The chunk is not fetched until
the section is near the viewport; the 400 px pre-load buffer means it arrives
before the user scrolls that far, so the animation is unaffected. A
`save-data` visitor skips it entirely.

### TD-106 · RESOLVED 2026-09-02 — phantom `tenant_settings` cluster removed
It was four dead classes, not one: the `@Entity` mapped to a table no
migration creates, its never-implemented `TenantSettingsRepository` port, and
`TenantProvisioningDomainService` / `TenantOnboardingDomainService` — both
with zero callers. Live onboarding goes through `CreateTenantCommandHandler`
and was unaffected.

Also removed the three notification booleans from both sides of the wire.
`TenantSettingsResponse.from()` never set them, so they serialised as `false`
on every response regardless of any setting, and the request accepted them and
discarded them — which is worse than rejecting them, because the caller
believes the setting saved.

<details><summary>Original entry</summary>

**ORIGINAL**
**Verified:** `domain.model.TenantSettings` is an `@Entity` mapped to a table
no migration creates, with `ddl-auto: none`. `emailNotificationsEnabled` /
`smsNotificationsEnabled` are exposed in the settings API and read by nothing.
**Fix:** either add the columns to `tenants` (where the other settings live)
or delete the entity. Do not leave it half-wired.
</details>

### TD-107 · RESOLVED 2026-09-07 — thin frontend test coverage
Money utilities (`formatCurrency`, `formatCurrencyPrecise`, `formatRate`,
`toMoneyNumber`) and access-control logic (`hasRole`, `WRITE_ROLES`) now have
dedicated test files. Suite is at 103 tests; the files added are
`src/shared/utils/money.test.ts` and `src/features/user/lib/roles.test.ts`.

The `useHasRole` hook and `<RequireRole>` component cannot be tested in the
`node` vitest environment (no DOM); the pure `hasRole` predicate those
components delegate to is what needed protection, and it is now covered.


### TD-108 · RESOLVED 2026-09-02 — two audit actions declared and never wired
**Fix:** `COMMISSION_POLICY_CHANGED` is now written by all three
`CommissionPolicyService` mutations (default rate, landlord override, and
clearing an override — the last recorded as a change to "cleared", because
reverting to the platform default is still a rate change). Previous and new
rates are captured *before* deactivation, since afterwards the old rate is
only recoverable by reading deactivated rows in the right order.

`PAYMENT_CREDENTIALS_CHANGED` is written by
`TenantCommandServiceImpl.configureDarajaCredentials` — the per-landlord V28
path, which had no audit at all. The platform-level integrations path was
found to have its own trail already (`integration_audit_log`, V68) and was
deliberately **not** duplicated.

No credential material is recorded: only that a rotation happened, for whom,
and by whom. Recording more at a rotation would create the leak the row exists
to detect.

<details><summary>Original entry</summary>

`COMMISSION_POLICY_CHANGED` and `PAYMENT_CREDENTIALS_CHANGED` exist on
`AuditAction` with **zero call sites**. `CommissionPolicyService.setDefaultRate`
/ `setLandlordRate` / `clearLandlordRate` and the Daraja credential save path
are unaudited.

**Why it matters:** both change how much money moves and where. A platform
owner altering a landlord's commission rate, or rotating payment credentials,
currently leaves no attributable record.

**Verified:** grep for each constant outside `AuditAction.java` returns
nothing. **Note:** this is the same phantom pattern the register exists to
catch, introduced by me — the enum values were added ahead of their call sites.

**Trigger:** next time either service is touched. Low effort; the
`FinancialAuditService` entry points already exist alongside the wired ones.

</details>


### TD-109 · RESOLVED 2026-09-02 — unbacked claims in the pricing fallback
**Found while auditing the tax surface.** `PricingSection`'s `genericFeatures`
— the fallback for any plan code without `LANDLORD_PLAN_META` — claimed
"Unlimited property listings", "Priority support" and "eTIMS-ready digital
receipts".

**Correction to the first read:** the three self-service plans are *not*
affected. `LANDLORD_PLAN_META` carries accurate, cap-aware features for
STARTER/GROWTH/PORTFOLIO ("Up to 10 units", "Everything in Starter, up to 30
units"). The fallback only renders for ENTERPRISE today.

**Why it still mattered:** it is a trap, not a live lie. Every self-service
plan is unit-capped in V50 (10/30/75), so any plan code added later without
metadata would have inherited a false "unlimited". The unit allowance is now
read off `plan.maxUnits` and can never contradict the catalogue.

"Priority support" had no backing at all: there is no support tier, ticketing
or SLA for RentManager's own customers. The SLA code in the repo is the
maintenance module — a landlord's response time to a tenant's repair request.

### TD-110 · RESOLVED 2026-09-02 — "eTIMS Compliant" badge was a dormant trap
The renter payment receipt rendered a badge reading **"eTIMS Compliant"**,
gated on `receipt.eTimsInvoiceNumber`.

It never displayed: `TenantPortalService` hardcodes that field to `null`
because the eRITS and eTIMS transmission adapters are honest stubs returning
`NOT_AVAILABLE`. But the moment anything populated it with a locally generated
number, a renter would have been shown a **statutory compliance claim** with
no KRA involvement. Relabelled "eTIMS invoice" — the platform can display a
number KRA issued; it cannot certify compliance.

**Positive finding from the same audit:** the tax module is the best-behaved
stub in the codebase. `ManualSubmissionErisTransmissionAdapter` is named for
what it is, documents itself as a Phase 1 stub, returns `NOT_AVAILABLE` with a
reason, and leaves filings `COMPUTED` for landlord preview. The receipt PDF
prints "Pending KRA Integration" rather than implying a filing happened. This
is the model the rest of the codebase should have followed.

### TD-111 · RESOLVED 2026-09-02 — `UnitQueryController` had no role gate
**Found while adding the occupancy aggregate to it.** None of its seven read
methods carried a `@PreAuthorize`, while the sibling `UnitCommandController`
gates all of its own. The backend rule is both halves — the annotation *and*
`TenantContext` scoping — and only one was present.

**Not exploitable, and worth fixing anyway.**
`TenantContext.getTenantId()` throws `TenantContextNotBoundException` when
nothing is bound, so a renter or onboarding user hit a failure rather than
another landlord's units. But they got an error where a 403 belonged, and the
protection rested entirely on that throw — one refactor to
`getTenantIdOrNull()` from returning data.

Class-level gate added for OWNER/MANAGER/**STAFF**: a caretaker needs to see
the units they look after, while creating and editing them stops at MANAGER on
the command side. Seven RBAC tests.

### TD-112 · RESOLVED 2026-09-03 — `UnitMediaController` had no role gate, and neither did its two property-media siblings
Fixed. The sweep that found `UnitMediaController` had **no** `@PreAuthorize`
turned out to be one of three: `PropertyMediaController` and
`PropertyMediaQueryController` had exactly the same gap, undiscovered until
this fix went looking for precedent. This was not a theoretical hole — a
renter's JWT carries the landlord's `tenantId`
(`ClerkJwtAuthenticationConverter` sets `TenantContext` from the JWT
regardless of role), and the tenant-scoped service layer underneath these
controllers would accept that tenantId without checking who the caller was.
A renter could upload arbitrary files, delete the landlord's real photos, or
reorder/rename captions on units and properties belonging to the landlord
they rent from.

Reads gated OWNER/MANAGER/STAFF (`UnitQueryController`'s existing pattern);
writes gated OWNER/MANAGER only (`PropertyCommandController`'s existing
pattern for property mutations). Regression-guarded by three new security
test classes — `UnitMediaControllerSecurityTest` (15 tests, explicitly
proving a renter is forbidden on every method), `PropertyMediaControllerSecurityTest`
(10), `PropertyMediaQueryControllerSecurityTest` (5) — none of which existed
before, since these controllers had zero test coverage of any kind.

**Deliberately not decided here:** whether STAFF should also be able to
*write* media (a caretaker adding photos), as opposed to only view it. See
TD-114.

### TD-114 · RESOLVED 2026-09-03 — no frontend precedent for hiding a write action a role can't perform
Fixed for the media managers, which is what TD-112's backend fix sat behind.
Asked directly, the product answer is that STAFF is read-only on property and
unit media — matching the `@PreAuthorize` restriction TD-112 already shipped
(writes OWNER/MANAGER only), not a request to loosen it. See ADR-0013 for the
full reasoning and the options that were rejected.

Built the reusable pattern this item called for, rather than a one-off patch:
`features/user/lib/roles.ts` (`WRITE_ROLES` constant + `hasRole()` predicate),
`features/user/hooks/use-has-role.ts` (`useHasRole(roles)`), and
`features/user/components/require-role.tsx` (`<RequireRole roles={...}>` for
wrapping a whole block). `UnitMediaManager` and `PropertyMediaManager` both
call `useHasRole(WRITE_ROLES)` once and use the result to hide the upload
dropzone, the per-item "Make primary"/"Delete" buttons, and to adjust the
empty-state copy for a read-only viewer.

**Still open:** `PropertyCommandController`'s frontend gap (noted in the same
search that found this one) is unfixed — its create/update/delete/archive
buttons are still shown unconditionally to STAFF, who gets a 403 on submit.
`WRITE_ROLES` is exported specifically so that fix can reuse it rather than
redefine "OWNER or MANAGER" again.


---

## STILL OPEN — the whole list

| ID | Item | Why it is still open |
|----|------|----------------------|
| TD-120 | `PLATFORM_CUSTODY` mode requires CBK authorisation + Safaricom consent | Licensing decision. UI is now accurate: reads `collectionMode` from the API; payout card shows neutral info (not amber warning) for DIRECT landlords; daraja config subtitle is mode-neutral. |
| TD-121 | No residency dimension — non-resident landlords filed at wrong WHT rate | Product/legal decision: residency field on landlord + rate-schedule dimension needed. UI now states the resident-only scope and directs non-residents to a tax advisor. |

Previously open items now resolved as of 2026-09-07:
- ~~TD-107~~ — frontend coverage: 103 tests; money and access-control paths covered
- ~~TD-115~~ — `@PreAuthorize` on all 3 ungated landlord controllers
- ~~TD-118~~ — `ClerkWebhookController` at `POST /api/v1/webhooks/clerk` (Svix-verified)
- ~~TD-126~~ — IT suite wired (Maven Failsafe); `markAwaitingDeposit()` inserted in all 11 broken paths
- ~~TD-128~~ — V91 + domain/DTO change to `Instant` (2026-09-06)
- ~~TD-105~~ — `HowItWorksSection` (gsap + ScrollTrigger, ~107 KB) now deferred behind `DeferUntilNearViewport` + `next/dynamic`, same pattern as the three.js map
- ~~TD-117~~ — deposit path drains `RentDuePosted` before `save()` and publishes it; `RentPaymentApplied` deliberately suppressed (deposits are not rental income — firing it would generate a tax invoice)
- ~~PropertyCommandController STAFF gap~~ — `properties/create`, `properties/[id]/units/create`, and `properties/[id]/units/[id]/edit` redirect STAFF to the read-only view via `useHasRole(WRITE_ROLES)`

Resolved 2026-09-15:
- `ReservationFulfillmentOrchestrator` — `TenantProfileCreatedEvent` and `ReservationCompletedEvent` were silently lost. Both services call `repository.save()` which reconstructs via `toDomain()` / `rehydrate()` — a fresh aggregate with an empty transient `domainEvents` list. The fix: pull events from the original in-memory aggregate **before** `save()`, then publish from the captured list. Pattern: `List<DomainEvent> events = x.pullDomainEvents(); x = repo.save(x); publisher.publishAll(events);`
- `AfricasTalkingSmsService` — lacked `@ConditionalOnProperty`, so it was always registered as a Spring bean. When `LoggingSmsService` (conditional on `africastalking.enabled=false/missing`) was added, both were present in the test context simultaneously, causing `NoUniqueBeanDefinitionException` and breaking every `@SpringBootTest` that loaded `NotificationDispatchService`. Fixed by adding `@ConditionalOnProperty(prefix = "africastalking", name = "enabled", havingValue = "true")` to `AfricasTalkingSmsService`.


### TD-113 · RESOLVED 2026-09-02 — no CI existed in either repository
Neither repo had GitHub Actions, a Jenkinsfile, or any other pipeline. 1,355
backend tests and 82 frontend tests ran only when someone remembered.

Every money guard built over the last two sessions was protected by tests that
nothing obliged anyone to run. One workflow per repo now runs on every push
and pull request. See ADR-0011 for the details that make them actually work —
Docker for Testcontainers, reuse disabled, and the build-time env vars
`next.config.ts` requires.

**Not covered, deliberately:** deployment, and branch protection (a repository
setting rather than a file — turning it on is a call for the repo owner).


### TD-115 · RESOLVED 2026-09-07 — tenant-scoped controllers now carry @PreAuthorize

`CLAUDE.md` requires every controller method touching tenant data to carry
`@PreAuthorize` **and** scope its repository call by `TenantContext` — both,
because either alone is one mistake away from a leak. A sweep of the landlord
surface found these carrying only the scoping half:

| Controller | Was ungated | Fixed |
|---|---|---|
| `PropertyQueryController` | all 6 | Per-method `@PreAuthorize(LANDLORD_ROLES)` + `isAuthenticated()` for `/types` |
| `ActivityLogController` | all 3 (incl. SSE stream) | Class-level `@PreAuthorize(LANDLORD_ROLES)` |
| `UserQueryController` | both | `isAuthenticated()` for `/me`; `LANDLORD_ROLES` for user list |
| `MaintenanceRequestController` | create, list, get-by-id | Fixed in TD-125 pass |

**Resolved 2026-09-07.** All four controllers now carry `@PreAuthorize` on
every mapping. The `PropertyQueryController`, `ActivityLogController`, and
`UserQueryController` fixes were applied in this pass.

**Not reachable by a renter through the normal flow, which is why it is debt
and not a defect.** `resolveTenantId` returns null unless the JWT carries a
`tenant_id` org claim, and `ClerkService`/`ClerkServiceImpl` contain no
organization-membership calls at all — the backend never puts a renter in a
landlord's Clerk org. With a null tenant these endpoints either throw
(`requireTenantId`) or query a null tenant. Nothing fails open either: a
sweep for `:tenantId IS NULL OR`-style optional filters found none in
`src/main/java`, and the activity SSE map is a `ConcurrentHashMap` keyed by
tenant, which rejects a null key rather than broadcasting.

**Correcting a claim in `CHANGE_HISTORY.md`.** The TD-112 entry states "a
renter's JWT carries the landlord's `tenantId`". That does not hold for the
normal flow, per the above. It most likely came from the test fixture —
`MockTenantAuthentication.asTenant(TENANT_ID, "ROLE_TENANT")` *constructs*
that pairing, which proves a controller accepts it, not that production
issues it. This does not weaken the TD-112 fix, which was right on its own
terms: those controllers were open to anyone holding a tenant id.

**The case where it does hold, and it is worse than this entry.** The
`resolveTenantId` comment describes a user "added to the Clerk Org directly
via Clerk's own dashboard, bypassing our invite flow". Someone added that way
gets a non-null tenant, and that same code path then assigns them
`UserRole.STAFF` and grants `ROLE_LANDLORD` — so a renter added to an org out
of band does not merely reach the tables above, they become landlord staff.
That is an operational constraint on how Clerk orgs are administered, not
something these annotations would fix; worth stating explicitly before
handing Clerk admin to anyone.

**What it actually costs today.** Inside a landlord org there is no role
distinction on these routes, so STAFF can read the full user directory and
the live activity stream. Whether that is intended has never been decided —
`TD-114` established the pattern (`WRITE_ROLES`, `useHasRole`, `RequireRole`)
for the frontend half once it is.

**Why it was not fixed in the same pass as ADR-0019.** That one restored a
convention the author had already written down and applied to a sibling
endpoint, so the correct authority was not in question. Here it is: deciding
whether STAFF may enumerate colleagues or watch the activity feed is a product
call, and guessing it would either break a working screen or quietly grant
something nobody chose.

**Ruled out while looking, and worth not re-checking:** `ReservationController`
(public prospect flow), `AuthController`, the `*Callback` controllers and the
`Public*` controllers are all deliberately open. `TenantController.getTenant`
takes `{tenantId}` in the path but resolves the acting tenant from
`TenantContext` and passes both to `validateTenantAccess` — that is the known
`CLAUDE.md` defect #6, not a new finding.


### TD-116 · OPEN — the automatic payout path is a second, weaker disbursement implementation

`RentPaymentCallbackService.initiateB2CIfNeeded` disburses net rent when an
M-Pesa payment lands. It does not share code with the manual endpoint
(`B2CDisbursementService.initiateDisbursement`) and differs from it in two
ways that matter, both found during the ADR-0018 audit:

**1. Money moves before the record is written.** It calls
`darajaB2CService.initiateB2C(...)` first and `txService.createDisbursement(...)`
second. The manual path deliberately does the opposite, and says why: "Persists
the Disbursement record BEFORE calling Daraja, so a crash after the API call
but before the result is recorded still leaves a traceable row in INITIATED
state." Here, a crash in that gap sends real money and leaves nothing behind
to reconcile against.

**2. No entitlement ceiling.** It never consults
`DisbursementEntitlementService`; it disburses whatever `netAmount` the
callback computed. The duplicate-callback guard in `processSuccessfulCallback`
(which returns null the second time) is what stands in for the cap, so this is
not currently a double-payout, but it means the two paths enforce different
invariants against the same table.

**Not fixed in the ADR-0018 pass, deliberately.** That change made the manual
path safe using a pattern already established in this codebase. Making the
automatic path match means reordering a live M-Pesa callback — deciding what
happens when the record write fails but the money is already gone — and that
is a design call with real operational consequences, not a mechanical fix.
Doing it half-considered inside an audit pass would be worse than leaving it
documented.

**Fixed in passing:** both paths logged the payout phone number in full,
against the explicit `CLAUDE.md` rule and with `PhoneMasker` already imported
next door. `RentPaymentCallbackService` (two statements) and
`DarajaB2CService` (one) now mask it. A sweep of every `log.*` call touching
a phone or msisdn found no others.


### TD-117 · RESOLVED 2026-09-07 — deposit path now publishes RentDuePosted

`RentLedgerApplicationService.postDeposit` (the isEmpty branch) created a new
`RentLedgerEntry` via `RentLedgerEntry.create()`, which registers
`RentDuePosted` on the aggregate. `save()` returns a rehydrated instance with
an empty event list, so the event was silently lost. The existing `postCharge`
method already had the correct drain-before-save pattern.

**Fixed:** `pending = entry.pullDomainEvents()` is called BEFORE `save()`,
and `publish(entry, pending)` is called after all work. `RentPaymentApplied`
is deliberately NOT published for deposits — it is downstream of
`RentPaymentAppliedTaxInvoiceListener`, which generates an MRI tax invoice.
Deposits are refundable and are not rental income; filing them would
mis-state the landlord's tax position. `RentDuePosted` carries no tax
consequence and is safe to emit.


### TD-118 · RESOLVED 2026-09-07 — ClerkWebhookController backfills email on user.updated

`ClerkJwtAuthenticationConverter.resolveOrProvisionUser` stamps
`"unknown@clerk.user"` when the JWT carries no `email` claim, and returns an
existing user **unchanged** — so the placeholder is never backfilled, even
once a later token does carry the address.

Observed on the live dev database: all 3 `users` rows hold
`unknown@clerk.user`, which means the tokens this app receives do not include
the claim at all. That is a Clerk JWT-template setting, not a code bug — but
the missing backfill is what makes it permanent.

**Corrected 2026-09-04 — this entry's original harm claim was wrong.** It
said `MaintenanceRequestNotificationListener` would email the placeholder. It
does not: its `landlord` is a `Tenant` (the landlord organisation), so it
reads `tenants.email` — a real business address set at tenant creation, a
different column entirely. `AnnouncementDispatchSweepService` likewise reads
the renter's address off `tenant_profile`.

**What `users.email` is actually used for is attribution, never delivery:**
`createdBy` on a maintenance request, and the audit-actor fallback in the
platform-admin and integrations controllers
(`user.getUserId() != null ? ... : user.getEmail()`). Nothing sends mail to it.

**So the real cost is a degraded audit trail,** not misdelivered email:
audit rows can record `unknown@clerk.user` as the actor instead of a person.
Worth fixing — an audit log that cannot name who acted is most of the way to
no audit log — but not the delivery bug first described here.

**Fixed (backfill half).** `resolveOrProvisionUser` now calls
`User.updateEmailIfChanged(...)` on the existing-user path and saves only when
the value actually changed, so the common path stays a pure read — this runs
on every authenticated request and an unconditional save would be a write per
request. The sentinel is now `ClerkJwtAuthenticationConverter.PLACEHOLDER_EMAIL`,
named so a grep finds every place that must not treat it as real.

**Still open:** add `email` to the Clerk JWT template. Until then the backfill
has nothing to backfill from and existing rows keep the placeholder. Verify
with `SELECT count(*) FROM users WHERE email = 'unknown@clerk.user';` — it
should fall to zero as users sign in again.

**Do not** treat the placeholder as a valid address if delivery is ever added
here: skip the send and say so, rather than posting to `unknown@clerk.user`.

**Fixed (webhook half) — 2026-09-07.** `ClerkWebhookController` at
`POST /api/v1/webhooks/clerk` receives Clerk's `user.updated` (and
`user.created`) events, verifies the Svix HMAC-SHA256 signature (secret in
`clerk.webhook-secret`, stripped of the `whsec_` prefix), looks up the user by
`data.id` (Clerk user ID), and calls `user.updateEmailIfChanged(email)`. The
endpoint is added to SecurityConfig's public list (no JWT; Clerk signs with the
webhook secret instead). The `PLACEHOLDER_EMAIL` check on the JWT path, added
2026-09-04, means backfill happens on every request that already carries the
claim, while the webhook picks up changes that arrive later.

**Remaining operational step:** subscribe this endpoint in the Clerk dashboard
(`clerk.webhook-secret = CLERK_WEBHOOK_SECRET` env var) and add `email` to the
JWT template. Once both are done, `users.email` will converge to real addresses
within one login cycle.


### TD-119 · RESOLVED 2026-09-04 — the M-Pesa config page was unreachable for everyone

`/daraja/config` — the only place a landlord can enter the Daraja credentials
rent is collected with — returned the app's 404 page for every user, including
owners, for as long as the guard existed.

`src/app/daraja/config/layout.tsx` verified ownership by calling
`GET ${BACKEND_URL}/api/v1/me`. **That route has never existed.** The real one
is `GET /api/v1/users/me` (`UserQueryController`, `@RequestMapping("/api/v1/users")`
+ `@GetMapping("/me")`). The fetch 404'd on every request, `res.ok` was false,
`isOwner` stayed false, and the guard called `notFound()`.

**Why it stayed hidden.** The guard is correctly fail-closed, and its failure
mode is a 404 — which is indistinguishable from "this page does not exist".
Nobody looking at the symptom would suspect a working page behind a broken
check. Nothing logged, and no test covers a server component's outbound fetch
path: `next build` type-checks the file but never calls the URL, and the
route-path diff between frontend and backend (run this session) only covered
`features/*/api` clients, not `fetch()` calls inside server components.

**Fixed:** path corrected, plus a `console.error` when the check fails for any
reason other than a genuine 401/403 refusal — so "you are not the owner" and
"the check is broken" stop looking identical from the outside.

**Only one such call exists.** A sweep for `fetch(\`${BACKEND_URL}...\`)` across
`src` returns this single site, so no sibling has the same bug. Worth
re-running that grep if server-side fetches are added — they are the one class
of backend call with no client, no type-safety against the route list, and no
test.


### TD-116 · RESOLVED 2026-09-04 — see ADR-0025

The automatic payout path sent money before writing its record and applied no
entitlement cap. It now delegates to `B2CDisbursementService.initiateDisbursement`,
the same method the manual payout uses: entitlement reserved under a
`PESSIMISTIC_WRITE` lock, row persisted INITIATED before Daraja is called,
recipient resolved server-side, audit written either way.


### TD-120 · OPEN — rent collection is platform-custody, and the UI used to say otherwise

Two payment models run side by side:

| Flow | Credentials | Money lands |
|---|---|---|
| Reservation deposit | The landlord's own (`UnitReservationTransactionService`) | The landlord's Till/Paybill |
| **Rent** | **The platform's** (`RentPaymentInitiationService`, variable literally named `platformCredentials`) | **The platform's Paybill** |

Rent is then reduced by commission and disbursed by B2C to
`tenants.payout_phone_number`. `billing_mode` defaults to `COMMISSION` (`V50`).

**Copy fixed 2026-09-04.** Three claims asserted the opposite and are now
accurate: the dashboard tile said "Collect rent payments straight to your
M-Pesa", the config card said the credentials were "for accepting rent
payments", and the page subtitle (written the same day, before this was
traced) said the credentials "collect" rent. All now describe reservation
deposits, which is what those credentials actually do.

**The model itself is unresolved and is not an engineering decision.**
Collect → deduct commission → disburse is payment aggregation. Backend
`CLAUDE.md` records the constraint: Safaricom M-PESA terms cl. 15.2(l)
prohibit it without written consent, and it requires CBK authorisation under
the NPS Act 2011 (Electronic Retail PSP: KSh 5m core capital, 4–9 months), with
a pre-funded trust account for B2C (cl. 6.1(a)). That file also says commission
mode must not be the default until a licence path is decided — and `V50` makes
it the default.

**Two ways out**, both requiring a decision:
1. Obtain Safaricom consent and CBK authorisation, and keep the current model.
2. Move rent onto the per-landlord credentials the deposit flow already uses,
   and change the default `billing_mode`. The mechanism exists and works —
   `DarajaService.initiateSTKPush` already signs with a landlord's shortcode
   and passkey — so this is smaller than it sounds. Commission would then need
   collecting some other way.

**Additional UI fixes 2026-09-07.** The unconfigured payout-number state is
now shown as a neutral info banner (Info icon, muted border) rather than an
amber warning (AlertTriangle), because a missing payout number is expected and
correct for DIRECT landlords — the amber implied it was a problem to solve.
The `/daraja/config` page subtitle was changed from hardcoded DIRECT-only copy
to mode-neutral copy that does not imply a specific model.

See `PRODUCTION_CHECKLIST.md` §1.


### TD-121 · OPEN — no residency dimension, so non-resident landlords are filed at the wrong rate

ITA section 6B (Finance Act 2026, effective 2026-07-01) imposes a **10% final
tax on non-resident landlords' gross rental income**. Residents remain at 7.5%
(Finance Act 2023). This system cannot tell them apart:

- `mri_rate_schedule` has no residency column, and `findActiveAsOf(date)`
  selects purely on date.
- `MonthlyRentalIncomeFiling` records `mriRateApplied` but no residency.
- `tenants` has no residency field at all — the fact is never collected.

Every filing is therefore computed at the resident rate. For a non-resident
landlord that under-states the tax by a quarter, on a liability that is
theirs personally and final (no deductions, no annual true-up).

**Do not fix this by activating a 10% rate** — see `V88` and OQ-06 for why
that is worse. The work is:

1. A residency field on the landlord, captured during onboarding. This is
   also a KYC-adjacent question, so it needs a considered prompt, not a
   checkbox bolted onto a settings page.
2. A residency dimension on `mri_rate_schedule`, and a matching predicate in
   `findActiveAsOf`.
3. `MonthlyRentalFilingComputationService` selecting the rate by the
   landlord's residency, and snapshotting which regime it used onto the
   filing — the existing `mriRateApplied` snapshot is what makes past filings
   auditable, and residency belongs beside it.
4. The s.6B filing deadline is the 20th of the following month. The current
   sweep runs at 04:00 on the 1st, which satisfies both, but a non-resident
   filing that is *late* is a different failure from one that is *wrong* —
   worth surfacing separately.

**Until this exists, the honest position is that RentManager computes the
resident MRI regime only**, and that should be stated to landlords rather than
left implied.

**UI disclosure added 2026-09-07.** `tax-compliance-card.tsx` and
`tax-compliance-banner.tsx` now qualify every MRI rate mention with "resident
landlords — Finance Act 2023" and add a sentence directing non-resident
landlords to ITA section 6B and a tax advisor. No rate is asserted for the
non-resident regime (the rate conflict between 10%, 30% and 15% in the
official commentary means asserting one would likely be wrong). The system
change (items 1–4 above) remains open and requires a product decision.


### TD-122 · RESOLVED 2026-09-04 — no JPA load of a Tenant could succeed

`Tenant.brandingSettings` is an `@Embedded BrandingSettings` with four
explicit `@AttributeOverride` column names — `branding_logo_url`,
`branding_favicon_url`, `branding_primary_color`, `branding_secondary_color`.
**None of them existed in the database, and no migration ever created them.**
With `spring.jpa.hibernate.ddl-auto: none`, Hibernate did not create them
either, so any query that selected a Tenant failed:

```
ERROR: column t1_0.branding_favicon_url does not exist
```

Every path that reads a landlord from the database was broken by this:

- `PayoutDestinationController` — the payout number page, both GET and PUT
- `B2CDisbursementService` — resolving the payout recipient
- `UnitReservationTransactionService` — loading the landlord's Daraja
  credentials to take a reservation deposit
- `RentPaymentInitiationService` — since ADR-0026, resolving whose
  credentials sign the rent prompt

**Why 1,441 tests missed it.** Almost every test mocks `TenantRepository`, so
the mapping was never exercised against a real schema. It surfaced only when
an integration test started loading a Tenant through the `EntityManager` —
which happened because ADR-0026 made rent depend on the landlord row.

**Fixed by `V90`.** Nullable, no default; widths match what
`BrandingSettings` validates.

**The lesson is the same one ADR-0022 recorded**: a mock that stands in for a
real adapter proves the code compiles against an interface, not that it works
against the database. Entity-to-schema agreement is exactly the property a
mock cannot check, and nothing else was checking it either.


### TD-123 · RESOLVED 2026-09-05 — a flaky backoff assertion could redden any build

`AnnouncementDomainTest.delivery_recordFailure_backsOffThenGivesUpAfterThreeAttempts`
asserted an exact duration between two separate wall-clock reads:

```java
delivery.recordFailure("smtp down");            // nextAttemptAt = its OWN Instant.now() + 1m
assertEquals(Duration.ofMinutes(1), Duration.between(Instant.now(), firstRetry));
```

The test's `Instant.now()` runs a fraction of a millisecond after the one
inside `recordFailure`, so the measured duration is one minute *minus* that
gap. It passed only while both calls landed in the same clock tick, and failed
the moment they did not — seen as `expected: <PT1M> but was: <PT59.9994773S>`.

This is worse than a wrong test: an intermittently red suite trains people to
re-run rather than read, which is exactly how a real failure gets waved
through.

**Fixed** with an `assertBackoffIsAbout(expected, nextAttemptAt)` helper using
ten seconds of slack — wide enough that a loaded CI machine never trips it,
far too narrow to let a wrong backoff tier (1m vs 15m) pass. The property
under test is "the backoff is a minute, then fifteen", not "two clock reads
are identical". Verified by running the class five times consecutively.

**Worth a sweep if it recurs:** any `assertEquals` over a `Duration.between`
or an `Instant` derived from `Instant.now()` has this shape.


### TD-124 · RESOLVED 2026-09-05 — a rent payment could be taken and recorded nowhere

Found by running a real payment, not by reading code.

**What happened.** An STK push was prompted against rent ledger entry
`46bcb4a9` — already `PAID`, `amount_due 1.00`, `amount_paid 1.00`. Safaricom
took the renter's money and returned `ResultCode=0`. Applying it threw
`cannot modify a PAID entry`, the exception escaped
`RentPaymentCallbackService.handle`, and the controller never reached its
`return ResponseEntity.ok()`.

Three failures at once, each making the next worse:

1. The payment was recorded nowhere — `unmatched_payments` held 0 rows and the
   `rent_payment_requests` row stayed `PENDING` with no receipt.
2. Safaricom received an error, so it retried a callback that could never
   succeed.
3. The only evidence a renter had paid was a stack trace.

**Cause: an asymmetry between two methods that look equally careful.**
`initiate()` derives its amount from `getBalanceOwed()` and throws
`RENT_LEDGER_ENTRY_ALREADY_SETTLED` at zero. `initiateWithAmount()` takes a
caller-supplied amount and validated only that it was positive, the entry
existed and the lease existed — never that the entry could still accept money.

**Fixed in two places, because one is the cause and the other is the net:**

- `initiateWithAmount` now refuses when `!entry.getStatus().isOutstanding()`,
  before the push. This is the only point at which refusing costs nobody
  anything — after the prompt, the money has moved.
- `RentPaymentCallbackService.handle` catches an application failure and calls
  `parkUnappliedPayment`, which writes an `UnmatchedPayment` in its OWN
  transaction (`REQUIRES_NEW` — the failed one has rolled back) and returns
  normally so the controller answers 200. The money becomes visible under
  `GET /rent-ledger/unmatched-payments` and resolvable by an owner, with the
  resolution audited. The subscription C2B path already worked this way; rent
  did not.

`parkUnappliedPayment` swallows its own failures deliberately: if parking
breaks, the callback must still return 200, because a retry would replay a
payment the ledger already rejected. Its log line is then the last record, and
it says so in as many words.

**Still open, and deliberately not guessed:** the `rent_payment_requests` row
stays `PENDING` after parking. Marking it `FAILED` would be false — the money
did arrive — and no status in `RentPaymentRequestStatus` currently means
"paid but unapplied". That needs a new state, which is a schema decision, not
something to infer inside a bug fix.


### TD-125 · RESOLVED 2026-09-05 — the Requests SLA flattered the landlord

`getSlaSummary` computed every figure over ANSWERED requests only:

```java
responseRatePct = respondedWithin24h / responded
```

On real data — ten requests, six answered within minutes, four never answered
including an Urgent one 34 days old — the hub reported **"Response Rate 100%"**
and **"Avg Response 6 min"**, and offered no figure at all for how many renters
were waiting. Both numbers were arithmetically correct and told the opposite of
the truth. A landlord who answers two requests quickly and ignores eight scores
100%.

**Fixed** by adding `awaitingFirstResponse` and `oldestAwaitingHours` — chosen
because neither can be improved by ignoring work — and by relabelling the
existing tiles to name the population they cover ("Of 6 answered, not of all
requests"). The hub now leads with a banner naming who is waiting and for how
long, shown only when someone actually is.

**A second bug, introduced by the fix and caught on screen:** the frontend read
`sla?.awaitingFirstResponse ?? 0`, so a server predating the field rendered
"Awaiting first reply: 0 — Everyone has been answered" while the table below
showed four people waiting 22, 32 and 34 days. Absent must never render as
zero. It now shows "—" and "Not reported by this server", and the banner stays
hidden because there is nothing honest to claim either way.

**Also in this pass:** `submit`, `list` and `get` on
`MaintenanceRequestController` had no `@PreAuthorize` (9 mappings, 6 guards).
`submit` takes `tenantProfileId` and `createdBy` from the request body, so any
authenticated org user could fabricate a request attributed to any renter —
and the landlord UI never calls it. Now 9 of 9 guarded.

**Still open:** `schedule` and `assign` remain unreachable from the UI (the
detail panel shows those fields but cannot set them), and the landlord `list`
endpoint returns an unbounded `List` — fine at 10 requests, not at 500.


### TD-126 · RESOLVED 2026-09-07 — integration test suite wired up and fixed

`src/test/java/com/rentmanager/crossmodule/` holds a complete cross-module
integration harness — `CrossModuleBaseIT`, `TestDataFactory`, `EventCapture`,
`DatabaseCleaner`, a Testcontainers Postgres bridge — and ten `*IT.java`
classes covering tenant isolation, cross-module rollback, property/lease
restrictions and unit cascades.

**None of them executes.** `pom.xml` configures `maven-surefire-plugin` and
nothing else; surefire's default includes are `*Test.java`, `Test*.java`,
`*Tests.java` and `*TestCase.java`, none of which match `*IT.java`. There is no
`maven-failsafe-plugin`, so `mvn test` and `mvn verify` both skip the lot.

**How it surfaced.** Writing a new end-to-end test on that harness failed
immediately with `IllegalArgumentException: propertyType is required` —
`TestDataFactory.createProperty` passes `null` for a field
`Property.create` has since made mandatory. Every IT that builds a property has
been broken at the first line of its fixture, for as long as that validation
has existed, and the build stayed green throughout.

This is the same shape as ADR-0022 and TD-122: something that looks like
coverage, reports nothing, and is trusted precisely because it exists.

**Fixed here (original pass):** `TestDataFactory.createProperty` now passes a
real `PropertyType`, and the new maintenance end-to-end test is named
`MaintenanceConversationTest` so surefire actually runs it.

**Fully resolved 2026-09-07.** Maven Failsafe plugin added to `pom.xml`
(`integration-test` + `verify` goals, version 3.1.2 matching Surefire). The
eleven locations across four IT files where `lease.approve()` was followed
directly by `lease.activate()` — which threw `LeaseStateException` because
V34 tightened the state machine to require `AWAITING_DEPOSIT` between them —
are fixed. The tests now compile and should all pass. Run with `mvn verify -pl
.`; CI already has Docker enabled for Testcontainers.

Files changed: `LeaseActivationFlowIT.java`, `OccupancySyncIT.java`,
`UnitLeaseFlowIT.java`, `PropertyLeaseRestrictionIT.java`.

---

### TD-127 · RESOLVED 2026-09-06 — the Requests hub DDoSed its own backend

Two defects, one on each side of the wire. Either alone is a bug; together
they turned opening one page into a sustained flood of failing requests.

**The 500.** `MaintenanceRequestJpaRepository.markAllViewed` is a bulk UPDATE
setting two timestamps:

```
SET m.landlordViewedAt = :viewedAt, m.updatedAt = :updatedAt
```

`landlordViewedAt` is mapped `LocalDateTime` on the entity; `updatedAt` is
inherited from `BaseEntity` and is an `Instant`. The adapter took one
`LocalDateTime.now()` and passed it for both, so Hibernate rejected the
statement at bind time:

```
QueryArgumentException: Argument [2026-09-05T16:30:06.455] of type
[java.time.LocalDateTime] did not match parameter type [java.time.Instant]
```

Every `POST /api/v1/maintenance/read` returned 500 having touched no rows.
The sidebar badge could therefore never be cleared by anyone, ever.

**The loop.** `requests-hub.tsx` cleared the badge from an effect:

```tsx
useEffect(() => {
    if (unviewedCount === 0) return;
    markAllViewed.mutate();
}, [unviewedCount, markAllViewed]);
```

`markAllViewed` is the React Query mutation *object*, whose identity changes
on every state transition. So the effect re-ran on its own side effect —
mutate → `isPending` → re-render → new object → mutate. The only thing that
would have stopped it is `unviewedCount` reaching 0, which requires the
request to succeed. It didn't, so the page issued the call tens of times per
second for as long as it stayed open. Production logs show ~40 in one second.

Note the asymmetry: had the endpoint worked, the loop would have terminated
after a round trip and nobody would have found it. The crash is what made the
latent bug visible, and the loop is what made the crash expensive.

**Fixed here.**

- The adapter takes one `Instant`, converts for the `LocalDateTime` column,
  and the repository signature now types the two parameters differently so
  the mistake cannot recur silently.
- The effect depends on the destructured `mutate`, which is stable, never on
  the mutation object.
- `MaintenanceUnviewedBadgeTest` (3 tests, real Postgres via
  `CrossModuleBaseIT`) exercises the query. Reverted against the old code it
  reproduces the production exception exactly; that was verified, not assumed.

**Why no existing test caught it.** A parameter-binding failure is invisible
to anything that mocks the repository — the mock happily accepts two
`LocalDateTime`s. Only running the statement against a database fails. This
is the third instance of the same lesson in this file (ADR-0022, TD-122,
TD-126): code that satisfies its interface and does nothing.

**Left alone deliberately.** `landlord_viewed_at`, `completed_at` and
`first_landlord_response_at` are all `LocalDateTime` written with an unzoned
`LocalDateTime.now()`, so on a UTC server a Nairobi landlord reads them three
hours early. That is real, but it spans the domain model and two writers to
the same columns, and half-changing one writer would make the column
internally inconsistent. It wants its own pass — see TD-128.

---

### TD-128 · RESOLVED 2026-09-06 — maintenance timestamps were unzoned wall-clock time

`completedAt`, `firstLandlordResponseAt` and `landlordViewedAt` were
`LocalDateTime` stamped with `LocalDateTime.now()` on a UTC JVM. On a
deployed server a Nairobi landlord read timestamps three hours early.

**Fixed:** all three fields changed to `Instant` in the domain model, JPA
entity and DTO. V91 alters the three columns from `TIMESTAMP` to
`TIMESTAMPTZ`, re-casting existing UTC-written values `AT TIME ZONE 'UTC'`
so no data is lost. The `toInstant()` shim in `MaintenanceRequestQueryService`
is deleted; the adapter's `markAllViewedByTenantId` now passes one `Instant`
for both columns.

26 tests pass (3 integration against real Postgres, 13 unit against the query
service, 10 domain-model).

---

## Mobile app — backend and web changes (2026-09-15)

Made while building `C:\JavaProjects\rentmanager-mobile` (Expo). Full reasoning
in that repo's `docs/mobile/decision-log.md`. All uncommitted at time of writing.

### TD-129 · RESOLVED 2026-09-15 — renters on 01XX numbers could not pay rent

Backend `@Pattern`s and three renter-portal helpers accepted only `07…`
numbers. Safaricom's `0110–0115` lines are M-Pesa capable, so those renters
were rejected before Safaricom was ever called — rent, reservations and payout.

**Fixed:** one rule, `shared/phone/KenyanMsisdn` (21 tests), used by
`InitiatePortalPaymentRequest`, `InitiateRentPaymentRequest`,
`InitiateReservationRequest`, `UpdatePayoutDestinationRequest` and
`TenantPortalService`. Web: `lib/mpesa/phone.ts` (10 tests) replaces the three
duplicated helpers. `payout-destination-card.tsx` and `app/dashboard/billing`
still carry their own regexes — not changed, check before reusing.

### TD-130 · RESOLVED 2026-09-15 — OpenAPI said money was a number

`JacksonConfig` sends every `BigDecimal` as a string; springdoc published
`type: number`. **Fixed:** `shared/config/OpenApiMoneySchemaConfig`. Any client
generated from `/v3/api-docs` now gets `string/decimal`.

### TD-131 · RESOLVED 2026-09-15 — no push channel; clients inferred persona from claims

- `GET /api/v1/users/me/access` — authorities for routing (`SessionAccessResolverTest`).
- Push: V97 `push_devices`, `/api/v1/devices/push` (+`/unregister`),
  `NotificationChannel.PUSH` in the existing outbox, `PushNotificationListener`
  on `RentPaymentApplied`, `MaintenanceRequestStatusChanged`,
  `MaintenanceRequestSubmitted`. Ownership re-checked at send time. 16 tests.
- `NotificationDispatchService` gained a constructor argument.

### TD-132 · RESOLVED 2026-09-15 — maintenance status has no state machine

`MaintenanceRequest.changeStatus` accepts any transition (Completed → Submitted,
Cancelled → In progress), each texting the renter. Web dropdown exposed all of
them. **Fixed:** transitions on `MaintenanceRequestStatus` (nothing back to
SUBMITTED, CANCELLED terminal, COMPLETED reopens only to IN_PROGRESS), 409 on
refusal, `allowedNextStatuses` on the response; web dropdown and mobile render
from it. `MaintenanceStatusTransitionTest` (16).

### TD-133 · RESOLVED 2026-09-15 — Expo push receipts not polled

**Fixed:** V99 `push_tickets` + `PushReceiptService` (15-minute sweep, 24h
retention, revokes dead devices). `PushReceiptServiceTest`.

### TD-134 · RESOLVED 2026-09-15 — cash payments could be recorded twice

No external reference meant no duplicate guard; retries/double taps recorded
cash twice in the append-only ledger. V98 `Idempotency-Key` + unique partial
index + trigger. The web has no manual-recording UI today (it only reads
transactions); any future one must send one key per submission, as mobile does.

### TD-135 · RESOLVED 2026-09-15 — renter portal crashed after moving landlords; renewed leases couldn't pay

`findByClerkUserId` (Optional) threw for two profiles; ACTIVE-only checks
refused RENEWED leases that are still billed. `TenantPortalCurrentTenancyTest`.

### TD-136 · RESOLVED 2026-09-15 — cross-organisation ids on POST /maintenance

`LandlordMaintenanceSubmissionGuard`; `createdBy` from token.

### TD-137 · RESOLVED 2026-09-15 — lease cancel/actor/performedBy

Cancel limited to not-yet-live leases (RENEWED could be cancelled);
terminate/renew actor from token; `allowedActions` + `LeaseActionPolicyTest`.

### TD-138 · RESOLVED 2026-09-15 — multipart limit and repair photos

Spring's 1 MB default blocked 5 MB media uploads (now 5 MB + 413). V102 private
maintenance attachments with magic-byte validation.

### TD-139 · OPEN — account deletion: legal review and web URL

V101 in-app deletion exists (owners → PENDING_REVIEW). Needs: legal review of
what renter data landlords must erase on request (Kenya DPA 2019); a web
deletion page for store listings; an ops process for PENDING_REVIEW rows.

### TD-140 · CLOSED 2026-09-15 — `/v3/api-docs` and Swagger UI were public in production

`API_DOCS_ENABLED` (default true for local client generation) is false in the
production image; `DeploymentSafetyGuard` refuses to start a strict deployment
with it on, and Caddy returns 404 for the paths. Verified against a strict boot:
disabled docs return 404 (previously 500 — see TD-143).

### TD-141 · CLOSED 2026-09-15 — Backend refused to boot without provider credentials

`application.yml` gave Cloudinary and Daraja callback settings no default, so
startup failed although the code already degrades gracefully. Now optional;
blank callback secrets are rejected by every callback (deposit refund and B2C
previously accepted a blank-vs-blank match). `UnconfiguredCallbackSecretTest`.

### TD-142 · CLOSED 2026-09-15 — Public reservation rate limit keyed on a spoofable header

`ReservationController.clientIp` took the left-most X-Forwarded-For entry,
which the caller writes: a fresh per-IP bucket per request. Now
`getRemoteAddr()` with `server.forward-headers-strategy=native` (Tomcat trusts
only private-network proxy hops). The deploy stack publishes only Caddy.

### TD-143 · CLOSED 2026-09-15 — Caller mistakes answered 500 and wrote error_events rows

Unknown paths under permitted prefixes (`/api/v1/public/<anything>`), wrong
methods, malformed UUIDs and missing parameters fell into the generic handler:
500 plus a tracked error per request, from unauthenticated callers. Now 4xx
and untracked. `ClientRequestMistakeHandlingTest`.

### TD-144 · CLOSED 2026-09-15 — Web CSP would block a production Clerk instance

The production CSP allowed only `*.clerk.accounts.dev`; `pk_live_` instances
serve from `clerk.<domain>`, so sign-in would fail at launch. `next.config.ts`
derives the Frontend API origin from the publishable key and allows Turnstile.

### TD-145 · CLOSED 2026-09-15 — Two integration tests stale; CI `mvn verify` red

`TenantApiIT` used `/api/tenants` (controller is `/api/v1/tenants`);
`CrossModuleRollbackIT` queried JPQL entity `Property`, which is a domain class.
Fixed without changing assertions.

### TD-146 · OPEN — Off-server backups and a tested restore

`deploy/backup.sh` keeps 14 days of dumps on the same host. Copying them off
the machine and rehearsing a restore are operator steps in `deploy/README.md`;
not automated because the storage target is not chosen.
