# RentManager Screenshot & GIF Capture Plan

## Objective
Capture high-quality, real UI screenshots and animated GIFs from the live application at https://www.rentmanagerke.workers.dev/ to replace placeholder SVGs in the README.

## Target Viewport
- **Desktop**: 1920x1080 (Full HD) for screenshots
- **GIF Viewport**: 1280x720 (HD) for smaller file sizes
- **Mobile**: 375x812 (iPhone X) for responsive demos

## Critical Screenshots Needed

### 1. Hero Banner / Landing Page
**File**: `assets/hero-banner.png`
- **URL**: https://www.rentmanagerke.workers.dev/
- **Viewport**: 1920x1080
- **Capture Area**: Full hero section including:
  - Main headline: "Find your next home..."
  - Search bar
  - Feature cards (Approved landlords, M-Pesa, Digital leases)
  - Statistics counter
- **Notes**: Capture when page is fully loaded with animations settled

### 2. Landlord Dashboard
**File**: `assets/landlord-dashboard.png`
- **URL**: https://www.rentmanagerke.workers.dev/dashboard (landlord view)
- **Viewport**: 1920x1080
- **Capture Area**: Main dashboard showing:
  - Revenue overview cards
  - Occupancy metrics
  - Recent transactions
  - Property list summary
  - Charts/analytics
- **Auth Required**: Yes (landlord account)

### 3. Renter Portal
**File**: `assets/renter-portal.png`
- **URL**: https://www.rentmanagerke.workers.dev/dashboard (renter view)
- **Viewport**: 1920x1080
- **Capture Area**: Tenant dashboard showing:
  - Rent balance
  - Payment history
  - Maintenance requests
  - Lease information
  - Receipt download options
- **Auth Required**: Yes (renter account)

### 4. Property Listings
**File**: `assets/property-listings.png`
- **URL**: https://www.rentmanagerke.workers.dev/listings
- **Viewport**: 1920x1080
- **Capture Area**: Browse properties page showing:
  - Filter/search bar
  - Property cards with images
  - Pricing and location info
  - "Reserve" CTAs
- **Auth Required**: No (public page)

### 5. Admin Panel
**File**: `assets/admin-panel.png`
- **URL**: https://www.rentmanagerke.workers.dev/admin
- **Viewport**: 1920x1080
- **Capture Area**: Admin dashboard showing:
  - System metrics
  - User management
  - Platform oversight tools
  - Analytics
- **Auth Required**: Yes (admin account)

### 6. M-Pesa Payment Flow
**File**: `assets/mpesa-payment.png`
- **URL**: Renter dashboard → Pay Rent
- **Viewport**: 1280x720 (for modal/dialog)
- **Capture Area**: M-Pesa STK Push dialog showing:
  - Amount to pay
  - M-Pesa phone number input
  - "Pay Now" button
  - Payment instructions
- **Auth Required**: Yes (renter account)

### 7. Digital Lease View
**File**: `assets/digital-lease.png`
- **URL**: Renter/Landlord dashboard → Lease section
- **Viewport**: 1920x1080
- **Capture Area**: Lease document interface showing:
  - Lease terms
  - Signed digitally badge
  - Download PDF option
  - Landlord & tenant details
- **Auth Required**: Yes

### 8. Maintenance Request
**File**: `assets/maintenance-request.png`
- **URL**: Renter dashboard → Maintenance
- **Viewport**: 1280x720
- **Capture Area**: Maintenance request form/list showing:
  - Request form
  - Category dropdown
  - Description field
  - Priority indicator
  - Status tracking
- **Auth Required**: Yes (renter account)

### 9. Receipt Generation
**File**: `assets/receipt-view.png`
- **URL**: Dashboard → Payments → Receipt
- **Viewport**: 1280x720
- **Capture Area**: Receipt display showing:
  - Payment amount
  - Date and time
  - M-Pesa reference
  - Landlord details
  - Download button
- **Auth Required**: Yes

### 10. Mobile Responsive View
**File**: `assets/mobile-responsive.png`
- **URLs**: Landing page, Dashboard
- **Viewport**: 375x812 (iPhone X)
- **Capture Area**: Side-by-side comparison
- **Auth Required**: Varies

---

## Animated GIF Requirements

### GIF 1: Complete User Flow (Renter Journey)
**File**: `assets/demo-renter-flow.gif`
- **Duration**: 30-45 seconds
- **Steps**:
  1. Landing page → Click "Browse Properties"
  2. Filter properties by location
  3. Click on a property
  4. View property details
  5. Click "Reserve Unit"
  6. Sign in / Sign up
  7. Pay deposit via M-Pesa
  8. Receipt generated
- **Viewport**: 1280x720
- **FPS**: 15-20
- **Target Size**: < 8MB

### GIF 2: Landlord Dashboard Tour
**File**: `assets/demo-landlord-dashboard.gif`
- **Duration**: 20-30 seconds
- **Steps**:
  1. Login to landlord dashboard
  2. Overview metrics (revenue, occupancy)
  3. Navigate to Properties tab
  4. Click into a property
  5. View tenants
  6. Check payment history
- **Viewport**: 1280x720
- **FPS**: 15-20
- **Target Size**: < 6MB

### GIF 3: M-Pesa Payment Animation
**File**: `assets/demo-mpesa-payment.gif`
- **Duration**: 15-20 seconds
- **Steps**:
  1. Renter dashboard showing rent balance
  2. Click "Pay Rent"
  3. M-Pesa dialog opens
  4. Enter phone number
  5. Click "Pay"
  6. Loading state
  7. Success message
  8. Receipt appears
- **Viewport**: 1280x720
- **FPS**: 20
- **Target Size**: < 4MB

### GIF 4: Property Search & Filter
**File**: `assets/demo-property-search.gif`
- **Duration**: 15 seconds
- **Steps**:
  1. Listings page
  2. Type in search: "Nairobi"
  3. Filter by price range
  4. Filter by bedrooms
  5. Results update live
  6. Hover over property card
- **Viewport**: 1280x720
- **FPS**: 15
- **Target Size**: < 4MB

### GIF 5: Maintenance Request Flow
**File**: `assets/demo-maintenance-request.gif`
- **Duration**: 15 seconds
- **Steps**:
  1. Renter dashboard
  2. Click "Report Issue"
  3. Fill maintenance form
  4. Select category (e.g., "Plumbing")
  5. Add description
  6. Submit
  7. Success confirmation
  8. Request appears in list with status
- **Viewport**: 1280x720
- **FPS**: 15
- **Target Size**: < 3MB

---

## Tools & Setup

### Screenshot Capture
- **Primary Tool**: Browser DevTools (F12 → Device Toolbar)
- **Alternative**: Greenshot / ShareX (Windows)
- **Format**: PNG (lossless)
- **Optimization**: TinyPNG / ImageOptim after capture

### GIF Creation
- **Primary Tool**: [ScreenToGif](https://www.screentogif.com/) (Free, Windows)
- **Alternative**: [Gifski](https://gif.ski/) (High quality, cross-platform)
- **Settings**:
  - FPS: 15-20
  - Encoder: Gifski for quality
  - Compression: High
  - Max file size: 10MB (GitHub limit)

### Automation Script (Optional)
- **Puppeteer** script to:
  - Navigate to URLs
  - Wait for animations
  - Take screenshots programmatically
  - Generate consistent captures

---

## Capture Workflow

### Step 1: Prepare Test Accounts
- [ ] Create test landlord account with sample properties
- [ ] Create test renter account with active lease
- [ ] Create test admin account
- [ ] Seed database with realistic test data

### Step 2: Capture Screenshots
- [ ] Open browser in 1920x1080 viewport
- [ ] Disable browser extensions
- [ ] Clear cache and cookies
- [ ] Navigate to each URL from the list above
- [ ] Wait for page load + animations
- [ ] Take screenshot
- [ ] Save with naming convention: `{feature}-{view}.png`

### Step 3: Create GIFs
- [ ] Open ScreenToGif
- [ ] Set recorder area to 1280x720
- [ ] Record each user flow (keep mouse movements smooth)
- [ ] Edit in ScreenToGif:
  - Remove unnecessary frames
  - Add cursor highlights if needed
  - Optimize file size
- [ ] Export as GIF

### Step 4: Optimize Assets
- [ ] Run PNGs through TinyPNG (compress ~50-70%)
- [ ] Run GIFs through Gifski or gifsicle
- [ ] Verify file sizes (GIFs < 10MB each)
- [ ] Check visual quality

### Step 5: Organize Assets
```
assets/
├── hero-banner.png
├── landlord-dashboard.png
├── renter-portal.png
├── property-listings.png
├── admin-panel.png
├── mpesa-payment.png
├── digital-lease.png
├── maintenance-request.png
├── receipt-view.png
├── mobile-responsive.png
├── demo-renter-flow.gif
├── demo-landlord-dashboard.gif
├── demo-mpesa-payment.gif
├── demo-property-search.gif
├── demo-maintenance-request.gif
└── architecture-diagram.svg (keep existing or create new)
```

### Step 6: Update README
- [ ] Replace placeholder SVG references with real PNGs
- [ ] Embed GIFs in appropriate sections
- [ ] Add alt text and captions
- [ ] Test GitHub rendering

---

## Quality Checklist

### Screenshots
- [ ] Resolution: 1920x1080 (desktop) or 1280x720 (modals)
- [ ] No personal/sensitive data visible
- [ ] No lorem ipsum or placeholder text
- [ ] All UI elements fully loaded
- [ ] Consistent browser chrome (or no chrome)
- [ ] Professional color scheme
- [ ] No broken images or icons
- [ ] File size: < 500KB each after compression

### GIFs
- [ ] Smooth, professional mouse movements
- [ ] Clear demonstration of feature
- [ ] No unnecessary waiting/loading (edit out)
- [ ] Reasonable playback speed (not too fast/slow)
- [ ] Loops seamlessly
- [ ] File size: < 10MB
- [ ] FPS: 15-20
- [ ] Alt text provided in README

---

## Timeline

- **Screenshots**: 2-3 hours (including setup and optimization)
- **GIFs**: 3-4 hours (recording, editing, optimization)
- **Total**: 5-7 hours for complete visual asset creation

---

## Notes

- If test accounts don't have realistic data, use browser DevTools to mock data
- For M-Pesa, use test credentials or demo mode if production payment is not safe to record
- Consider creating a "demo" branch with seeded data for consistent screenshots
- Take multiple shots of each screen and choose the best one
- Keep backups of original (uncompressed) files

---

## Success Criteria

✅ All placeholder SVGs replaced with real screenshots
✅ At least 3 high-quality animated GIFs demonstrating core flows
✅ All images optimized for web (< 500KB PNGs, < 10MB GIFs)
✅ README renders perfectly on GitHub
✅ Visuals accurately represent production UI
✅ No sensitive data exposed
✅ Professional, recruiter-ready presentation
