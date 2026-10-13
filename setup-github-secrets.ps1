# Auto-configure GitHub Secrets for RentManager Frontend
# This script reads from .env.production and sets GitHub repository secrets

Write-Host "🔐 Configuring GitHub Secrets..." -ForegroundColor Cyan
Write-Host ""

$repo = "hassan200503/rentmanager-frontend"

# Read the .env.production file
$envFile = ".env.production"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Error: .env.production not found" -ForegroundColor Red
    exit 1
}

# Extract the values we need
$clerkPublishableKey = ((Select-String -Path $envFile -Pattern "^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=(.+)$").Matches.Groups[1].Value).Trim()
$clerkSecretKey = ((Select-String -Path $envFile -Pattern "^CLERK_SECRET_KEY=(.+)$").Matches.Groups[1].Value).Trim()

Write-Host "📋 Found in .env.production:" -ForegroundColor Yellow
Write-Host "  ✓ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: $($clerkPublishableKey.Substring(0, 20))..."
if ($clerkSecretKey -match "YOUR_PRODUCTION_SECRET_KEY_HERE") {
    Write-Host "  ⚠️  CLERK_SECRET_KEY: Placeholder detected - needs real value" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ CLERK_SECRET_KEY: $($clerkSecretKey.Substring(0, 15))..."
}
Write-Host ""

# Prompt for missing Cloudflare credentials
Write-Host "🌐 Cloudflare Configuration Needed:" -ForegroundColor Cyan
Write-Host ""
Write-Host "To get these values:"
Write-Host "1. Go to: https://dash.cloudflare.com/profile/api-tokens"
Write-Host "2. Create token with 'Edit Cloudflare Workers' template"
Write-Host "3. Find Account ID at: https://dash.cloudflare.com/ (in URL or sidebar)"
Write-Host ""

$cloudflareToken = Read-Host "Enter CLOUDFLARE_API_TOKEN"
$cloudflareAccountId = Read-Host "Enter CLOUDFLARE_ACCOUNT_ID"

# Validate the Account ID shape now, while the user can still fix it. Cloudflare
# IDs are 32 hex characters. The most common mistake is pasting the dashboard URL,
# keeping the quotes, or leaving a stray newline -- all of which make wrangler
# fail ~3 minutes into the deploy with only "Invalid account ID".
$cleanAccountId = $cloudflareAccountId.Trim().Trim('"').Trim("'")
if ($cleanAccountId -notmatch '^[0-9a-fA-F]{32}$') {
    Write-Host ""
    Write-Host "❌ CLOUDFLARE_ACCOUNT_ID is not a 32-character hex string." -ForegroundColor Red
    Write-Host "   Got: '$cloudflareAccountId' ($($cloudflareAccountId.Length) chars)" -ForegroundColor Red
    Write-Host "   Open https://dash.cloudflare.com/ and copy ONLY the Account ID" -ForegroundColor Yellow
    Write-Host "   (right sidebar) -- not the URL, no quotes, no spaces." -ForegroundColor Yellow
    exit 1
}
$cloudflareAccountId = $cleanAccountId

# If Clerk secret is placeholder, prompt for real one
if ($clerkSecretKey -match "YOUR_PRODUCTION_SECRET_KEY_HERE") {
    Write-Host ""
    Write-Host "⚠️  Clerk Secret Key needs to be updated" -ForegroundColor Yellow
    Write-Host "Get it from: https://dashboard.clerk.com/ → API Keys"
    $clerkSecretKey = Read-Host "Enter CLERK_SECRET_KEY (starts with sk_live_)"
}

Write-Host ""
Write-Host "🔒 Setting GitHub Secrets..." -ForegroundColor Green

# Set the secrets using gh CLI
try {
    # Check if gh CLI is authenticated
    $ghUser = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ GitHub CLI not authenticated. Running gh auth login..." -ForegroundColor Red
        gh auth login
    }

    # Use --body, not a piped value. Piping `echo $x` appends a trailing newline
    # that gh stores inside the secret, which then breaks CLOUDFLARE_ACCOUNT_ID.
    # Check $LASTEXITCODE so a failed `gh secret set` triggers the catch block.
    Write-Host "  Setting CLOUDFLARE_API_TOKEN..." -NoNewline
    gh secret set CLOUDFLARE_API_TOKEN --repo $repo --body $cloudflareToken
    if ($LASTEXITCODE -eq 0) { Write-Host " ✓" -ForegroundColor Green } else { throw "gh secret set CLOUDFLARE_API_TOKEN failed" }

    Write-Host "  Setting CLOUDFLARE_ACCOUNT_ID..." -NoNewline
    gh secret set CLOUDFLARE_ACCOUNT_ID --repo $repo --body $cloudflareAccountId
    if ($LASTEXITCODE -eq 0) { Write-Host " ✓" -ForegroundColor Green } else { throw "gh secret set CLOUDFLARE_ACCOUNT_ID failed" }

    Write-Host "  Setting CLERK_SECRET_KEY..." -NoNewline
    gh secret set CLERK_SECRET_KEY --repo $repo --body $clerkSecretKey
    if ($LASTEXITCODE -eq 0) { Write-Host " ✓" -ForegroundColor Green } else { throw "gh secret set CLERK_SECRET_KEY failed" }

    Write-Host "  Setting NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY..." -NoNewline
    gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --repo $repo --body $clerkPublishableKey
    if ($LASTEXITCODE -eq 0) { Write-Host " ✓" -ForegroundColor Green } else { throw "gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY failed" }

    Write-Host ""
    Write-Host "✅ All secrets configured successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Triggering deployment..." -ForegroundColor Cyan
    
    # Trigger a new deployment by pushing an empty commit
    git commit --allow-empty -m "chore: trigger deployment with secrets configured"
    git push origin main
    
    Write-Host ""
    Write-Host "✅ Deployment triggered!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Monitor progress at:" -ForegroundColor Cyan
    Write-Host "   https://github.com/$repo/actions"
    Write-Host ""
    Write-Host "🌐 Site will be live at:" -ForegroundColor Cyan
    Write-Host "   https://www.rentmanagerke.workers.dev/"
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "❌ Error setting secrets: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual setup instructions:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/$repo/settings/secrets/actions"
    Write-Host "2. Click 'New repository secret'"
    Write-Host "3. Add each secret manually"
    Write-Host ""
    exit 1
}
