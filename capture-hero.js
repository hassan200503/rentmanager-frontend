const puppeteer = require('puppeteer');
const path = require('path');

async function captureHero() {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('Capturing hero banner...');
    await page.goto('https://www.rentmanagerke.workers.dev/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 45000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const screenshotPath = path.join(__dirname, 'assets', 'hero-banner.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    
    console.log('✓ Hero banner captured successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureHero();
