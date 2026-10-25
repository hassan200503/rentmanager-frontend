# Deployment Guide

Complete guide for deploying RentManager to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Frontend Deployment (Cloudflare Pages)](#frontend-deployment)
3. [Backend Deployment (Cloudflare Workers)](#backend-deployment)
4. [Database Setup](#database-setup)
5. [Environment Variables](#environment-variables)
6. [CI/CD with GitHub Actions](#cicd-setup)
7. [Monitoring and Logging](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18+ installed
- ✅ Git installed
- ✅ Cloudflare account
- ✅ PostgreSQL database (Neon, Supabase, or self-hosted)
- ✅ M-Pesa Daraja API credentials
- ✅ Domain name (optional, Cloudflare provides *.pages.dev)

---

## Frontend Deployment

### Option 1: Cloudflare Pages (Recommended)

#### Via Cloudflare Dashboard

1. **Connect Repository**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Pages Project**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Pages** → **Create a project**
   - Connect your GitHub repository
   - Select `rentmanager-frontend` repository

3. **Configure Build Settings**
   ```
   Framework preset: Create React App
   Build command: npm run build
   Build output directory: build
   Root directory: /
   ```

4. **Set Environment Variables**
   ```
   REACT_APP_API_BASE_URL=https://api.rentmanagerke.workers.dev
   REACT_APP_ENV=production
   ```

5. **Deploy**
   - Click **Save and Deploy**
   - Wait for build to complete (~2-3 minutes)
   - Your site will be live at `https://rentmanager-frontend.pages.dev`

#### Via Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the project
npm run build

# Deploy to Cloudflare Pages
wrangler pages publish build --project-name=rentmanager-frontend
```

### Option 2: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Environment Variables:**
```
REACT_APP_API_BASE_URL=https://api.rentmanagerke.workers.dev
```

### Option 3: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=build
```

---

## Backend Deployment

### Cloudflare Workers

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Configure wrangler.toml**
   
   Create `wrangler.toml` in your backend directory:
   ```toml
   name = "rentmanager-api"
   main = "src/index.js"
   compatibility_date = "2026-10-25"

   [env.production]
   workers_dev = false
   route = "api.rentmanagerke.workers.dev/*"

   [env.production.vars]
   ENVIRONMENT = "production"

   [[env.production.r2_buckets]]
   binding = "ASSETS"
   bucket_name = "rentmanager-assets"
   ```

4. **Set Secrets**
   ```bash
   # JWT Secret
   wrangler secret put JWT_SECRET --env production

   # M-Pesa Credentials
   wrangler secret put MPESA_CONSUMER_KEY --env production
   wrangler secret put MPESA_CONSUMER_SECRET --env production
   wrangler secret put MPESA_PASSKEY --env production

   # Database URL
   wrangler secret put DATABASE_URL --env production

   # SMTP Credentials
   wrangler secret put SMTP_USER --env production
   wrangler secret put SMTP_PASS --env production
   ```

5. **Deploy**
   ```bash
   # Deploy to production
   wrangler publish --env production
   ```

---

## Database Setup

### Option 1: Neon (Serverless PostgreSQL)

1. **Create Account**
   - Go to [neon.tech](https://neon.tech)
   - Sign up and create a new project

2. **Get Connection String**
   ```
   postgres://user:pass@ep-example-123.us-east-2.aws.neon.tech/neondb
   ```

3. **Run Migrations**
   ```bash
   # Install Prisma CLI
   npm install -g prisma

   # Set DATABASE_URL in .env
   echo "DATABASE_URL=your_neon_connection_string" > .env

   # Run migrations
   prisma migrate deploy
   ```

### Option 2: Supabase

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project

2. **Get Connection String**
   - Go to **Project Settings** → **Database**
   - Copy the connection pooler string

3. **Run Migrations**
   ```bash
   prisma migrate deploy
   ```

### Database Schema Migration

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Deploy to production
npx prisma migrate deploy
```

---

## Environment Variables

### Frontend (.env)

```bash
# Production
REACT_APP_API_BASE_URL=https://api.rentmanagerke.workers.dev
REACT_APP_ENV=production
REACT_APP_GA_TRACKING_ID=UA-XXXXXXXXX-X
REACT_APP_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Backend (Cloudflare Secrets)

```bash
# Required
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
DATABASE_URL=postgresql://user:pass@host:5432/rentmanager

# M-Pesa
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_mpesa_passkey

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Optional
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          REACT_APP_API_BASE_URL: ${{ secrets.API_BASE_URL }}
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: rentmanager-frontend
          directory: build

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: backend
          command: publish --env production
```

### GitHub Secrets

Add these secrets to your GitHub repository:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `API_BASE_URL`

---

## Custom Domain Setup

### 1. Add Domain to Cloudflare

```bash
# Add your domain to Cloudflare
# Update nameservers at your registrar
```

### 2. Configure DNS

Add CNAME record:
```
Type: CNAME
Name: www (or @)
Target: rentmanager-frontend.pages.dev
Proxy: Enabled (orange cloud)
```

### 3. Configure Pages Custom Domain

- Go to **Cloudflare Pages** → **Your Project** → **Custom domains**
- Add your domain: `www.rentmanagerke.com`
- Wait for SSL certificate provisioning (~5 minutes)

### 4. Configure Workers Route

- Go to **Cloudflare Workers** → **Your Worker** → **Triggers**
- Add route: `api.rentmanagerke.com/*`

---

## Monitoring

### 1. Cloudflare Analytics

- **Pages**: Real-time visitors, bandwidth, requests
- **Workers**: Invocations, errors, CPU time
- **Access via**: Cloudflare Dashboard → Analytics

### 2. Sentry (Error Tracking)

```bash
# Install Sentry
npm install @sentry/react @sentry/tracing

# Configure in src/index.js
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.REACT_APP_ENV,
  tracesSampleRate: 1.0,
});
```

### 3. Google Analytics

```javascript
// Add to public/index.html
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-XXXXXXXXX-X"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-XXXXXXXXX-X');
</script>
```

---

## Performance Optimization

### 1. Enable Caching

```javascript
// In Workers
export default {
  async fetch(request, env) {
    const cache = caches.default;
    let response = await cache.match(request);
    
    if (!response) {
      response = await handleRequest(request, env);
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'max-age=3600');
      response = new Response(response.body, {
        ...response,
        headers
      });
      await cache.put(request, response.clone());
    }
    
    return response;
  }
}
```

### 2. Enable Compression

Cloudflare automatically compresses responses (Brotli, gzip).

### 3. Image Optimization

Use Cloudflare Images or integrate with Cloudinary:

```javascript
// Cloudflare Image Resizing
const imageUrl = `https://rentmanagerke.com/cdn-cgi/image/width=800,quality=85/${originalUrl}`;
```

---

## Security Checklist

- [ ] All secrets stored in Cloudflare Secrets (not in code)
- [ ] HTTPS enabled (automatic with Cloudflare)
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (Content Security Policy)
- [ ] JWT tokens with expiry
- [ ] Password hashing with bcrypt
- [ ] Regular security audits

---

## Backup Strategy

### Database Backups

```bash
# Automated daily backups with Neon
# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore backup
psql $DATABASE_URL < backup_20261025.sql
```

### Code Backups

- Git repository (GitHub)
- Regular commits and tags
- Release branches for production

---

## Troubleshooting

### Build Failures

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+
```

### Deployment Issues

```bash
# Check Wrangler auth
wrangler whoami

# Validate wrangler.toml
wrangler dev

# Check logs
wrangler tail --env production
```

### Database Connection Issues

```bash
# Test connection
npx prisma db push

# Check connection string format
# Should be: postgresql://user:pass@host:5432/dbname

# Verify firewall rules (if self-hosted)
```

### M-Pesa Integration Issues

```bash
# Test credentials
curl https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials \
  -u "CONSUMER_KEY:CONSUMER_SECRET"

# Check callback URL is accessible
# Use ngrok for local testing
ngrok http 3001
```

---

## Rollback Procedure

### Frontend Rollback

```bash
# Via Cloudflare Dashboard
# Pages → Deployments → Previous deployment → Rollback

# Via CLI
wrangler pages deployment list --project-name=rentmanager-frontend
wrangler pages deployment rollback <deployment-id>
```

### Backend Rollback

```bash
# Redeploy previous version
git checkout <previous-commit>
wrangler publish --env production
```

---

## Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] API endpoints respond
- [ ] Authentication works
- [ ] M-Pesa payments functional
- [ ] Database migrations applied
- [ ] SSL certificate active
- [ ] Custom domain resolves
- [ ] Error tracking configured
- [ ] Analytics tracking
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured

---

## Support

For deployment support, contact: devops@rentmanagerke.com

---

## Useful Commands

```bash
# Frontend
npm run build              # Build for production
npm run lint               # Lint code
npm test                   # Run tests

# Backend
wrangler dev               # Local development
wrangler publish           # Deploy to production
wrangler tail              # View logs
wrangler secret list       # List secrets

# Database
npx prisma migrate deploy  # Run migrations
npx prisma studio          # Open database GUI
npx prisma db push         # Push schema changes
```
