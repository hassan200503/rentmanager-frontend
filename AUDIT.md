# RentManager — Phase 0 Discovery & Audit

**Date:** 2026-08-12
**Status:** Gates Phase 1 implementation. Every claim below was verified by reading code, not assumed.

---

## 3.1 Stack & infrastructure

| Question | Finding |
|---|---|
| Frontend framework | Next.js **16.2.9** (App Router), React 19.2.4, TypeScript 5 |
| Auth frontend | `@clerk/nextjs@7.5.3`, `clerkMiddleware` renamed guard file `src/proxy.ts` (Next 16 convention), route-policy RBAC in `src/lib/rbac/route-policy.ts` |
| Frontend hosting | Unknown host (no hosting config in repo; `next.config.ts` requires `BACKEND_URL` in production builds) |
| Frontend env | `src/lib/config/env.ts` + Zod validation `src/lib/config/validation.ts`; Clerk publishable key is a build-time `NEXT_PUBLIC_*` |
| Backend | Spring Boot **3.2.5** (Java), `com.rentmanager`, Maven, module-per-domain layout |
| Database | PostgreSQL via JDBC + **Flyway** migrations (`classpath:db/migration`, V1…V67) |
| Backend env | `spring-dotenv` reads `.env`; all secrets via `${VAR:default}` placeholders in `application.yml` |
| API topology | Frontend rewrites `/api/v1/:path*` → `BACKEND_URL` (`src/proxy.ts` matcher excludes `/api`, then `next.config.ts` rewrites). **All real business logic lives in the backend.** |
| Tests | Frontend: Vitest (`npm test`). Backend: Maven surefire + Testcontainers (`mvn test -f C:\JavaProjects\rentmanager-backend -pl .`), full suite green (990 tests) |
| CI | None configured in either repo |

## 3.2 Auth & RBAC reality check

- **Clerk is fully integrated.** Frontend SDK 7.5.3 (supports Dynamic Keys); backend validates JWTs via RS256 JWKS (`CLERK_JWKS_URL`) and `ClerkJwtAuthenticationConverter`.
- **OWNER / ADMIN roles** are platform-level, derived from a custom "backend" JWT template claim (`platformRole`), decoded in `src/proxy.ts` and by `ClerkJwtAuthenticationConverter` into authorities `ROLE_PLATFORM_OWNER` / `ROLE_PLATFORM_ADMIN`.
- **Server-side gate**: every `/api/v1/admin/**` controller method carries `@PreAuthorize("hasAnyAuthority('ROLE_PLATFORM_OWNER','ROLE_PLATFORM_ADMIN')")`; writes additionally require `hasAuthority('ROLE_PLATFORM_OWNER')`. The frontend never decides authorization for data (it only hides buttons).
- **Clerk keys today**: single instance, build-time env vars (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` in frontend; `clerk.secret-key` in backend). No dev/prod split, no Dynamic Keys resolver, no webhook-less sync.
- Clerk Backend API client exists: `ClerkServiceImpl` (create users, sign-in tokens, metadata) using `ClerkProperties` (`clerk.secret-key`, `clerk.base-url=https://api.clerk.com/v1`) — per-request-key switching is a small change (`createClerkClient`-style, or per-call secret).

## 3.3 Existing integration code — inventory

### M-Pesa / Daraja — REAL, PRODUCTION-CODED, env-configured
| File | What it does |
|---|---|
| `modules/reservation/infrastructure/daraja/DarajaService.java` | STK Push + status query + token cache + global Safaricom-compatible rate limiter (burst 3, 30/min). Takes per-call `DarajaCredentials` (tenant-level) |
| `modules/rentledger/infrastructure/daraja/DarajaB2CService.java` | B2C `/mpesa/b2c/v3/paymentrequest` using **platform** `DarajaProperties` + `daraja.b2c.*` properties |
| `modules/rentledger/infrastructure/daraja/RentPaymentInitiationService.java` | STK for rent collection, platform credentials (NOT landlord's) |
| `modules/tenant/.../DarajaCredentialEncryptionConverter.java` | AES-256-GCM per-landlord credentials at rest, key `DARAJA_CREDENTIALS_ENCRYPTION_KEY` (`daraja.credentials-encryption-key`), singleton key, **no keyVersion** |
| `modules/tenant/.../TenantEntity` credentials fields | `V28__add_daraja_credentials_to_tenants.sql` |
| Callbacks | `RentPaymentCallbackService` (STK result → ledger → auto B2C), `RentPaymentCallbackTransactionService` (idempotent on CheckoutRequestID; dedup confirmed), reservation deposit callback, subscription billing callback, Ratiba standing orders (feature-flagged off) |
| Frontend | `src/features/daraja/*` + `/daraja/config` page for **landlord-level** credentials; `PlatformSettingsService` derives the SANDBOX badge from `daraja.base-url` |

**Config source today**: `daraja.*` env properties (`DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`, `DARAJA_SHORT_CODE`, `DARAJA_PASSKEY`, `DARAJA_BASE_URL`, callbacks, `DARAJA_CALLBACK_SECRET`, `DARAJA_CREDENTIALS_ENCRYPTION_KEY`) plus **undocumented** `daraja.b2c.*` (`DARAJA_B2C_INITIATOR_NAME`, `DARAJA_B2C_SECURITY_CREDENTIAL`, `DARAJA_B2C_RESULT_URL`, `DARAJA_B2C_QUEUE_TIMEOUT_URL` — no application.yml block for the b2c prefix).

### Africa's Talking SMS — REAL sender behind an env switch
- `AfricasTalkingSmsService` (WebClient, form-encoded, sandbox-compatible; real response parsing confirmed) active only when `africastalking.enabled=true`; otherwise `LoggingSmsService` stub. Both implement `SmsService`.
- Properties: `africastalking.api-key/username/sender-id/base-url` (`AT_API_KEY`, `AT_USERNAME`, `AT_SENDER_ID`, `AT_BASE_URL`).

### WhatsApp — STUB ONLY
- `WhatsAppService` interface + `LoggingWhatsAppService` (logs and skips). **No Meta Cloud API sender exists.** Announcements module (with opt-in fan-out, outbox, dispatch sweep, template `announcement_utility_v1`) is built and exercised in tests against the stub.
- **No incoming webhook for Meta** exists (X-Hub-Signature-256 verify + inbound handler are greenfield).

### Email — SMTP sender behind an env switch
- `JavaMailEmailService` (spring-boot-starter-mail `JavaMailSender`) active only when `app.notification.email.enabled=true`; else `LoggingEmailService`. SMTP connection prefs (host/port) come from Spring Boot's `spring.mail.*` auto-config — **not currently in application.yml**, so the real sender is effectively unwireable today without ad-hoc env.
- `NotificationDispatchService` + outbox (`notification_deliveries` table) + `NotificationRetryScheduler` (retry every 5 min): the outbox is the retry/backoff backbone shared by SMS/Email/WhatsApp.

### Media / file storage — Cloudinary, env-configured
- `CloudinaryConfig` `@Bean` from `cloudinary.cloud-name/api-key/api-secret` (`CLOUDINARY_*`), fails startup when secret blank (production blocker if unset).
- `MediaUploadService` (upload/destroy; platform brand assets + property/unit media). All uploads are Cloudinary — **no local-disk persistence found** (local-disk blocker does not apply).

### Clerk — see 3.2.

### Other discovered integrations
- **Stripe**: env vars exist (`.env.example`) but **no Stripe code found** in either repo → not wired, out of scope.
- **Sentry**: `NEXT_PUBLIC_SENTRY_DSN` declared but no SDK usage → out of scope.
- **GeoLocation**: `GeoLocation` value object only (lat/lng) — no Maps/geocoding API calls → out of scope.
- **PDF**: `@react-pdf/renderer` used client-side for lease docs — local generation, no external provider → out of scope.
- **Push notifications / SMS OTP / job queues**: notification outbox + `@Scheduled` sweeps are the job system (no BullMQ/Inngest). No FCM/mobile client → out of scope.

## 3.4 The live incident — "29 failed M-Pesa payments that never settled"

- Root mechanic confirmed in code: `RentPaymentRequestJpaEntity` has statuses `PENDING | PAID | FAILED`; a request is marked `FAILED` by `RentPaymentCallbackTransactionService.processFailedCallback` (callback `ResultCode != 0` or missing receipt) and by the expiry sweep (`subscription.payment-request-expiry-minutes=30` default).
- The Overview card shows `payments.paymentRequestsFailed` from `PlatformAdminQueryService` → `PaymentRequestStatusCount` projection over `rent_payment_requests`.
- **Root cause is configuration, not code**: the STK pushes were initiated against placeholder/env credentials (`DARAJA_CONSUMER_KEY` defaults to literal `YOUR_CONSUMER_KEY`), so Daraja rejected or never called back, and the 30-minute expiry sweep flipped the requests to `FAILED`. Callback handling is idempotent and unit-tested; the failure path (ResultCode/callback/expiry) collapses correctly to a `FAILED` row.
- **Acceptance test**: entering a valid (sandbox) Daraja config for the platform, activating it, and re-running/retrying the failed requests must let them settle. A `retry` surface exists for **disbursements** (`/admin/disbursements/{id}/retry`), but **no retry endpoint exists for failed rent payment requests** — this must be added (Replay now only possible via `RentPaymentInitiationService` re-initiation); plan adds `POST /admin/integrations/payments/failed/retry`? — no: retry belongs in the rent-ledger module, exposed on the Disbursements page per the brief.

## 3.5 Data model & money flow

- Commission math confirmed: rent collected via STK → `rent_transactions` records gross, `commission_amount`, `net_amount`; callback auto-initiates B2C for `netAmount` (`RentPaymentCallbackService.initiateB2CIfNeeded`) → `disbursements` (`DisbursementJpaEntity`), status machine `INITIATED → PENDING → SUCCESS/FAILED` with `requires_manual_attention`, `retry_count`, failure reasons.
- Platform commission is retained (never physically moves); disbursement = collected rent − platform commission. **Matches the brief.**
- Per-landlord overrides: **Daraja credentials already exist per-landlord** (tenant-level, encrypted). SMS/WhatsApp/email are strictly platform-global today. Keep that model (no new multi-tenancy).

## 3.6 Gap list — provider → exists today → notes

| Provider | Today | Notes / work |
|---|---|---|
| M-Pesa (Daraja platform) | Yes (env) | Move platform creds to DB config (dev/prod), keep env as seed/fallback; document `daraja.b2c.*`; add failed-request replay |
| M-Pesa (per-landlord) | Yes (encrypted DB) | Leave as-is (already correct pattern); UI exists at `/daraja/config` |
| Africa's Talking SMS | Yes (env + switch) | Move to DB config; runtime enable/disable; test-connection via real sandbox send |
| WhatsApp (Meta Cloud API) | Stub | Build real `MetaWhatsAppCloudService` (Graph API, permanent tokens, template send, signatures on inbound) |
| Email (SMTP) | Partial (env + switch) | Move SMTP creds to DB config; `JavaMailSender` built per active config |
| Media (Cloudinary) | Yes (env) | Move creds to DB config; runtime cloud switch; test-connection ping |
| Clerk | Yes (env) | Move `clerk.secret-key` to DB config; test-connection user-list; frontend publishable key documented caveat + "Copy as .env" |
| Stripe / Sentry / Maps / FCM / PDF | Declared-only / none | Out of scope (no load-bearing evidence) |

## Key architectural decisions

1. **Control plane lives in the backend** (single source of truth — it is where every provider is called), exposed as `/api/v1/admin/integrations/**`, OWNER-guarded. The frontend console is a thin, premium client.
2. **Environment model per brief option (b)**: per-provider Development/Production configs with an `is_active` switch; the existing global `SANDBOX` badge becomes *derived* from the active Daraja environment (deployment-tier signal), not a single global switch. One provider can be live against Production while another stays in Development.
3. **Encryption at rest**: reuse the proven AES-256-GCM pattern from `DarajaCredentialEncryptionConverter`, but with a `key_version` column (rotation-ready) and a shared `INTEGRATION_ENCRYPTION_KEY` (fallback to the existing `DARAJA_CREDENTIALS_ENCRYPTION_KEY` value for a zero-config migration).
4. **Registry + env fallback**: `IntegrationRegistry` resolves active credentials (60s TTL cache, invalidated on write). While a provider has no DB config, it falls back to the existing environment variables — the app stays runnable in every environment today, and the Owner's first save through the UI takes over.
5. **Graceful degradation stays**: unconfigured providers keep the existing stub/log behavior; `IntegrationNotConfiguredException` never surfaces as a 500 to renters/landlords.
6. **Test Connection is real**: per-provider live checks (Daraja OAuth token; AT real SMS to a supplied number; Meta template send to a supplied recipient; SMTP send to a supplied address; Cloudinary upload+ping+delete; Clerk user list).