# Security Policy

## Supported Versions

RentManager Frontend is actively maintained. Security patches are released for the latest version.

| Version | Supported |
|---------|-----------|
| Latest  | ✅ Yes    |
| < Latest| ❌ No     |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do not** create a public GitHub issue for security vulnerabilities.
2. Email us at: **security@rentmanager.ke** (or your contact email)
3. Include the following details:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- We will acknowledge receipt within **48 hours**
- We will provide an initial assessment within **7 business days**
- We will keep you informed of progress throughout the remediation process
- Public disclosure will be coordinated with you

## Security Best Practices in This Project

- **Environment validation**: All runtime configuration is validated via Zod at startup
- **Defense-in-depth RBAC**: Route-level authorization enforced via `src/proxy.ts`
- **No secrets in client**: `NEXT_PUBLIC_*` variables are public at build-time; sensitive keys stay server-side
- **Clerk authentication**: Industry-standard auth with JWT templates for role-based claims
- **Audit trail**: All sensitive operations are logged for traceability

## Scope

This security policy covers:
- `rentmanager-frontend` repository
- Deployment configurations (Docker, Netlify, Cloudflare/OpenNext)

Out of scope:
- Third-party services (Clerk, Stripe, M-Pesa APIs) — report to their respective security teams