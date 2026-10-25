/**
 * RentManager Screenshot & GIF Capture Script
 * Captures real UI screenshots and animated GIFs from the live application
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'https://www.rentmanagerke.workers.dev';
const ASSETS_DIR = path.join(__dirname, 'assets');

// Viewport configurations
const DESKTOP_VIEWPORT = { width: 1920, height: 1080 };
const HD_VIEWPORT = { width: 1280, height: 720 };
const MOBILE_VIEWPORT = { width: 375, height: 812, isMobile: true };

// Ensure assets directory exists
async function ensureAssetsDir() {
  try {
    await fs.mkdir(ASSETS_DIR, { recursive: true });
    console.log('✓ Assets directory ready');
  } catch (error) {
    console.error('Error creating assets directory:', error);
  }
}

// Capture screenshot with retry logic
async function captureScreenshot(page, options) {
  const { name, url, viewport, selector, fullPage = false, delay = 1000 } = options;
  
  try {
    console.log(`📸 Capturing: ${name}...`);
    
    // Set viewport
    await page.setViewport(viewport);
    
    // Navigate to URL
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Optional: wait for specific selector
    if (selector) {
      await page.waitForSelector(selector, { timeout: 10000 });
    }
    
    // Capture screenshot
    const screenshotPath = path.join(ASSETS_DIR, `${name}.png`);
    
    if (selector) {
      const element = await page.$(selector);
      await element.screenshot({ path: screenshotPath });
    } else {
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: fullPage 
      });
    }
    
    console.log(`✓ Saved: ${name}.png`);
    return screenshotPath;
  } catch (error) {
    console.error(`✗ Error capturing ${name}:`, error.message);
    return null;
  }
}

// Capture animated GIF by taking multiple screenshots
async function captureGif(page, options) {
  const { name, url, viewport, actions, duration = 5000 } = options;
  
  try {
    console.log(`🎬 Recording GIF: ${name}...`);
    
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Execute actions (clicks, scrolls, etc.)
    if (actions && typeof actions === 'function') {
      await actions(page);
    }
    
    // For now, just capture a screenshot - GIF conversion requires additional tools
    const screenshotPath = path.join(ASSETS_DIR, `${name}.png`);
    await page.screenshot({ path: screenshotPath });
    
    console.log(`✓ Saved: ${name}.png (GIF conversion requires ffmpeg/gifsicle)`);
    return screenshotPath;
  } catch (error) {
    console.error(`✗ Error recording ${name}:`, error.message);
    return null;
  }
}

// Main capture function
async function captureAll() {
  console.log('🚀 Starting RentManager Screenshot Capture...\n');
  
  await ensureAssetsDir();
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set default user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  try {
    // 1. Hero Banner / Landing Page - Full homepage
    await captureScreenshot(page, {
      name: 'hero-banner',
      url: BASE_URL,
      viewport: DESKTOP_VIEWPORT,
      delay: 3000,
      fullPage: false
    });
    
    // 2. Property Listings Page
    await captureScreenshot(page, {
      name: 'property-listings',
      url: `${BASE_URL}/listings`,
      viewport: DESKTOP_VIEWPORT,
      delay: 3000
    });
    
    // 3. Full Landing Page (with all sections)
    await captureScreenshot(page, {
      name: 'full-landing',
      url: BASE_URL,
      viewport: DESKTOP_VIEWPORT,
      delay: 3000,
      fullPage: true
    });
    
    // 4. How It Works Section
    await captureScreenshot(page, {
      name: 'how-it-works',
      url: `${BASE_URL}/#how-it-works`,
      viewport: DESKTOP_VIEWPORT,
      delay: 2000
    });
    
    // 5. Pricing Section
    await captureScreenshot(page, {
      name: 'pricing-section',
      url: `${BASE_URL}/#pricing`,
      viewport: DESKTOP_VIEWPORT,
      delay: 2000
    });
    
    // 6. FAQ Section
    await captureScreenshot(page, {
      name: 'faq-section',
      url: `${BASE_URL}/#faq`,
      viewport: DESKTOP_VIEWPORT,
      delay: 2000
    });
    
    // 7. Sign Up Page - Landlord
    await captureScreenshot(page, {
      name: 'signup-landlord',
      url: `${BASE_URL}/public/sign-up?intent=landlord`,
      viewport: DESKTOP_VIEWPORT,
      delay: 2000
    });
    
    // 8. Sign Up Page - Renter
    await captureScreenshot(page, {
      name: 'signup-renter',
      url: `${BASE_URL}/public/sign-up?intent=renter`,
      viewport: DESKTOP_VIEWPORT,
      delay: 2000
    });
    
    // 9. Sign In Page
    await captureScreenshot(page, {
      name: 'signin-page',
      url: `${BASE_URL}/public/sign-in`,
      viewport: DESKTOP_VIEWPORT,
      delay: 2000
    });
    
    // 10. Mobile Responsive View - Homepage
    await captureScreenshot(page, {
      name: 'mobile-homepage',
      url: BASE_URL,
      viewport: MOBILE_VIEWPORT,
      delay: 3000
    });
    
    // 11. Mobile Responsive View - Listings
    await captureScreenshot(page, {
      name: 'mobile-listings',
      url: `${BASE_URL}/listings`,
      viewport: MOBILE_VIEWPORT,
      delay: 3000
    });
    
    // 12. Features Section Screenshot
    await captureScreenshot(page, {
      name: 'features-overview',
      url: BASE_URL,
      viewport: HD_VIEWPORT,
      delay: 2000
    });
    
    console.log('\n✅ Screenshot capture completed!');
    console.log(`📁 Screenshots saved to: ${ASSETS_DIR}`);
    
  } catch (error) {
    console.error('❌ Capture process failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the capture
captureAll().catch(console.error);
