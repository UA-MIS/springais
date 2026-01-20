const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  try {
    // Navigate to the dashboard
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait a bit for any animations
    await page.waitForTimeout(2000);
    
    // Take a full page screenshot
    await page.screenshot({ 
      path: 'dashboard-screenshot.png', 
      fullPage: true 
    });
    
    console.log('Screenshot saved to dashboard-screenshot.png');
    
    // Also capture the viewport only
    await page.screenshot({ 
      path: 'dashboard-viewport.png', 
      fullPage: false 
    });
    
    console.log('Viewport screenshot saved to dashboard-viewport.png');
    
  } catch (error) {
    console.error('Error capturing screenshot:', error.message);
    
    // Try to capture whatever is on the page anyway
    await page.screenshot({ 
      path: 'dashboard-error.png', 
      fullPage: true 
    });
    console.log('Error state screenshot saved to dashboard-error.png');
  }
  
  await browser.close();
})();

