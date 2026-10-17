# Architecture Overview

Key locations:
- src/app/layout.tsx - global providers & metadata
- src/app/(app)/layout.tsx - authenticated route boundary
- src/proxy.ts - RBAC proxy and pre-render protection
- src/lib/config/validation.ts - environment validation

Request flow (simplified):
1. proxy reads Clerk claims and pathname
2. resolveRoutePolicy decides next/sign-in/redirect
3. Next.js renders or redirects accordingly
