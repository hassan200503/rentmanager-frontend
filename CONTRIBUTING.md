# Contributing to RentManager Frontend

Thank you for considering a contribution to RentManager! This is a production-grade property management platform built for the Kenyan rental market. We welcome contributions from developers, designers, and product thinkers.

## Code of Conduct

By participating, you agree to treat everyone with respect and courtesy. Harassment, discrimination, or unprofessional behavior will not be tolerated.

## How to Contribute

### 1. Fork & Clone

```bash
git clone https://github.com/hassan200503/rentmanager-frontend.git
cd rentmanager-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

```bash
cp .env.example .env.local
# Fill in your Clerk keys, API URL, and other required variables
```

### 4. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 5. Make Your Changes

Follow the existing code structure:
- `src/features/*` — Domain feature modules
- `src/lib/` — Auth, RBAC, API clients, config
- `src/shared/` — Shared UI components
- `src/app/` — Next.js App Router pages

### 6. Run Checks Before Committing

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Tests
npm test

# Build
npm run build
```

### 7. Commit & Push

```bash
git add .
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
```

### 8. Open a Pull Request

Include:
- A clear description of the change
- Testing steps
- **Screenshots or GIFs for UI changes** (required for visual modifications)

## UI Change Requirements

For any frontend/UI changes, your PR **must** include:
1. Screenshot(s) of the changed component(s)
2. GIF or video showing the interaction (for animations/flows)
3. Before/after comparison (if applicable)

Place assets in `assets/` and reference them in your PR description.

## Deployment

This project supports multiple deployment targets:
- Docker
- Netlify
- Cloudflare / OpenNext
- Standard Node hosting

See the README for deployment instructions.

## Questions?

Open an issue or reach out to the maintainer.