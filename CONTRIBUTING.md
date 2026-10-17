# Contributing to RentManager (frontend)

Thank you for contributing! This guide explains the preferred workflow, local checks, and PR expectations to keep the frontend high-quality and recruiter-ready.

Get started
1. Fork the repo and create a branch from `main`.
   - Naming convention: `feature/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`.
2. Install:
   ```bash
   npm ci
   ```
3. Copy env template:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with dev keys
   ```

Local checks
- Type-check (recommended):
  ```bash
  npx tsc --noEmit
  ```
- Tests:
  ```bash
  npm test
  ```
- Lint:
  ```bash
  npm run lint
  ```

API & generated types
- If the backend OpenAPI contract changes, regenerate types using the repository's client generation script (or `openapi-typescript`). Add instructions in the PR if generation is necessary.

Pull request checklist
- Title and description clearly explain the change and why.
- Include testing steps and any env changes required.
- Ensure `npx tsc --noEmit` passes.
- Add or update tests where appropriate.
- Include screenshots or a short GIF for UI changes.

Code review & merging
- Assign reviewers and request at least one approval.
- Wait for CI to pass (tests, lint). If CI is not available, ensure local checks are green.
- Prefer small, focused PRs for faster review.

Thank you — your careful changes keep the project professional and easy to evaluate by recruiters and maintainers.
