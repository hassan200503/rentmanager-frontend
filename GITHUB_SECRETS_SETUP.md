# 🔐 GitHub Secrets Configuration Guide

## ⚠️ What actually broke (read this first)

The last deployment failed at the **Deploy** step with:

```
✘ [ERROR] Invalid account ID "***" set in the `CLOUDFLARE_ACCOUNT_ID`
  environment variable. Account IDs may only contain alphanumeric
  characters, hyphens, and underscores.
```

The secret was **present** — the "Check the required secrets are set" step passed — but its **value was malformed**. The most common cause is a **trailing newline** that got baked in when it was set with:

```powershell
echo $id | gh secret set CLOUDFLARE_ACCOUNT_ID --repo ...   # ← adds \r\n
```

A Cloudflare Account ID is **exactly 32 lowercase hex characters** (`0-9a-f`). Nothing else — not the dashboard URL, not quotes, not a trailing newline. Wrangler rejects anything else.

**The fix:** re-set the secret with a clean value (see [Fix the malformed Account ID](#-fix-the-malformed-account-id-fastest) below), then re-run the workflow. The deploy workflow and `setup-github-secrets.ps1` have since been hardened so this class of mistake is caught in ~1 second with a clear message instead of ~3 minutes into the deploy.

> If you are setting secrets up for the **first time**, continue to
> [How to Add GitHub Secrets](#-how-to-add-github-secrets).

---

## 🩹 Fix the malformed Account ID (fastest)

1. Get the correct value from https://dash.cloudflare.com/ → **Account ID** in the right sidebar. It looks like `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6` — **32 hex chars, no URL, no quotes, no spaces**.
2. Overwrite the secret using `--body` (never `echo … | gh secret set`, which appends a newline — and don't pipe a string literal either, PowerShell adds one there too):

   ```powershell
   gh secret set CLOUDFLARE_ACCOUNT_ID `
       --repo hassan200503/rentmanager-frontend `
       --body "YOUR_32_CHAR_HEX_ID"
   ```

   `--body` passes the value as an argument, so no trailing newline can sneak in.

3. Re-run the failed workflow: Actions → the failed run → **Re-run all jobs**.

The updated workflow now validates the Account ID shape up front, so if it is
still wrong you'll see a one-line error like `CLOUDFLARE_ACCOUNT_ID looks like a
URL…` or `…must be exactly 32 hex characters…` within the first seconds.

---

## ✅ What the deploy needs

Four repository secrets, configured in **Settings → Secrets and variables → Actions**:

1. `CLOUDFLARE_API_TOKEN`
2. `CLOUDFLARE_ACCOUNT_ID`
3. `CLERK_SECRET_KEY`
4. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (aliased as `CLERK_PK` inside the workflow)

---

## 📋 How to Add GitHub Secrets

### Step 1: Go to Repository Settings
1. Open your repository: https://github.com/hassan200503/rentmanager-frontend
2. Click **Settings** tab (top right)
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add Each Secret

Click **"New repository secret"** button and add each of the following:

---

### 🔹 1. CLOUDFLARE_API_TOKEN

**How to get it:**
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Use template: **"Edit Cloudflare Workers"**
4. Scope it to your account
5. Copy the generated token

**Secret name:** `CLOUDFLARE_API_TOKEN`  
**Secret value:** `<paste your Cloudflare API token>`

---

### 🔹 2. CLOUDFLARE_ACCOUNT_ID

**How to get it:**
1. Go to: https://dash.cloudflare.com/
2. Select your account (if you have multiple)
3. Look at the URL - it will be: `https://dash.cloudflare.com/<ACCOUNT_ID>`
4. The hex string in the URL is your Account ID

**OR:**

1. Go to: https://dash.cloudflare.com/ → Workers & Pages
2. In the right sidebar, you'll see "Account ID"
3. Copy it

**Secret name:** `CLOUDFLARE_ACCOUNT_ID`  
**Secret value:** `<paste your Account ID>`  

> ⚠️ **Format matters.** Paste **only** the 32-character hex string from the URL
> or the sidebar — never the full `https://dash.cloudflare.com/<id>` address,
> never wrapped in quotes, and with **no trailing spaces or newline**. A value
> that isn't exactly 32 hex characters makes the deploy fail with
> `Invalid account ID`. If you set it from the terminal, use `--body`
> (see [Using the GitHub CLI](#-using-the-github-cli-recommended)) rather than
> `echo … | gh secret set`, which appends a newline.

---

### 🔹 3. CLERK_SECRET_KEY

**How to get it:**
1. Go to: https://dashboard.clerk.com/
2. Select your application
3. Go to **API Keys** section (left sidebar)
4. Copy the **Secret Key** (starts with `sk_live_` or `sk_test_`)

**Secret name:** `CLERK_SECRET_KEY`  
**Secret value:** `<paste your Clerk secret key>`

---

### 🔹 4. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

**How to get it:**
1. Same place as above: https://dashboard.clerk.com/ → API Keys
2. Copy the **Publishable Key** (starts with `pk_live_` or `pk_test_`)

**Secret name:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`  
**Secret value:** `<paste your Clerk publishable key>`

---

## 🖥️ Using the GitHub CLI (recommended)

Setting secrets from the terminal is faster and less error-prone than the web
UI — **provided you use `--body`**. Passing the value as an argument via `--body`
means no trailing newline can sneak in, which is exactly what corrupted
`CLOUDFLARE_ACCOUNT_ID` last time.

```powershell
$repo = "hassan200503/rentmanager-frontend"

gh secret set CLOUDFLARE_ACCOUNT_ID            --repo $repo --body "YOUR_32_CHAR_HEX_ID"
gh secret set CLOUDFLARE_API_TOKEN             --repo $repo --body "YOUR_API_TOKEN"
gh secret set CLERK_SECRET_KEY                 --repo $repo --body "sk_live_..."
gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --repo $repo --body "pk_live_..."
```

**Do NOT do this** — the `echo … |` pipe stores a trailing newline inside the secret:

```powershell
echo $id | gh secret set CLOUDFLARE_ACCOUNT_ID --repo $repo   # ❌ adds \r\n
```

The repo's `setup-github-secrets.ps1` has been updated to use `--body`, to trim
stray quotes/whitespace, and to validate the Account ID is 32 hex chars before
setting anything. Prefer running that script over setting secrets by hand:

```powershell
.\setup-github-secrets.ps1
```

---

## 🚀 After Adding Secrets

Once all 4 secrets are added:

### Option 1: Re-run the Failed Workflow
1. Go to: https://github.com/hassan200503/rentmanager-frontend/actions
2. Click on the failed "Deploy to Cloudflare Workers" run
3. Click **"Re-run all jobs"** button (top right)

### Option 2: Trigger a New Deployment
```bash
cd C:\Users\kkc36\Documents\RentManager\rentmanager-frontend
git commit --allow-empty -m "chore: trigger deployment with secrets configured"
git push origin main
```

---

## ✅ Verification

The deployment should:
1. ✅ Pass the "Check the required secrets are set" step
2. ✅ Build the Worker with OpenNext (~2-3 minutes)
3. ✅ Report bundle size
4. ✅ Deploy to Cloudflare Workers
5. ✅ Site live at: https://www.rentmanagerke.workers.dev/

---

## 🔍 Finding Your Secret Values

If you don't know where your secrets are:

### Cloudflare Secrets:
- **Dashboard:** https://dash.cloudflare.com/
- **API Tokens:** https://dash.cloudflare.com/profile/api-tokens

### Clerk Secrets:
- **Dashboard:** https://dashboard.clerk.com/
- **API Keys:** In your app → API Keys (left sidebar)

### Environment Variables (if you have them):
Check your local `.env` file or `.env.production` file:
```bash
# Check if you have them locally
cat .env.production
cat .env.local
```

---

## 🆘 Still Having Issues?

1. **Verify all secrets are set:**
   - Go to: Settings → Secrets and variables → Actions
   - You should see all 4 secrets listed (values are hidden)

2. **Check secret names match exactly:**
   - `CLOUDFLARE_API_TOKEN` (not `CLOUDFLARE_TOKEN`)
   - `CLOUDFLARE_ACCOUNT_ID` (not `ACCOUNT_ID`)
   - `CLERK_SECRET_KEY` (not `CLERK_SECRET`)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (not `CLERK_PK` - that's just the alias)

3. **Verify Cloudflare token permissions:**
   - Token must have "Edit Cloudflare Workers" permissions
   - Token must be scoped to the correct account

4. **Check Clerk keys are for the right environment:**
   - Use `pk_live_` and `sk_live_` for production
   - Make sure they're from the same Clerk application

5. **Seeing `Invalid account ID "***"` at the Deploy step?**
   - The `CLOUDFLARE_ACCOUNT_ID` value is malformed (not that it's missing — the
     secret check passed). It is almost always one of:
     - a **trailing newline/space** (came from `echo … | gh secret set`), or
     - the **full dashboard URL** pasted instead of just the hex ID, or
     - **quotes** left around the value.
   - Fix it with `--body` per [Fix the malformed Account ID](#-fix-the-malformed-account-id-fastest),
     then re-run. The hardened workflow will now reject a bad shape in the first
     seconds with a specific message.

---

## 📝 Summary

**Status:** ⚠️ Secrets are set, but `CLOUDFLARE_ACCOUNT_ID` was stored malformed
(a trailing newline from `echo … | gh secret set`), which made the **Deploy**
step fail with `Invalid account ID`.

**Fix Required:** Re-set `CLOUDFLARE_ACCOUNT_ID` to the clean 32-hex-char value
using `--body` (see [Fix the malformed Account ID](#-fix-the-malformed-account-id-fastest)).
**Time Required:** ~2 minutes.
**Then:** Re-run the workflow (Actions → failed run → Re-run all jobs).

The workflow's secret-check step and `setup-github-secrets.ps1` have been
hardened so a bad Account ID shape now fails fast with a clear message instead
of ~3 minutes into the deploy. Once the secret is corrected, pushes to `main`
deploy to production automatically. 🎉
