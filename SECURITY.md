# Security Policy

- Never commit secrets.
- Keep server-side keys (CLERK_SECRET_KEY, STRIPE_SECRET_KEY, webhook secrets) in secret managers.
- The proxy is defense-in-depth; backend must enforce final authorization.
