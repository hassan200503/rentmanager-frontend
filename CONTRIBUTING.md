# Contributing to RentManager (frontend)

Thank you for contributing to RentManager Frontend. This guide outlines the workflow, local checks, and expectations.

## Quick start
1. Fork and create a branch from `main`.
2. Install:
   npm ci
3. Copy env template:
   cp .env.example .env.local
4. Run checks:
   npx tsc --noEmit
   npm test
   npm run lint

## PR checklist
- Clear title & description
- Test plan and steps
- Typecheck, tests & lint passing
- Screenshots/GIFs for UI changes
