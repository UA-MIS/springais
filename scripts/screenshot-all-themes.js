const { chromium } = require('playwright');

const themes = ['green', 'blue', 'purple', 'teal', 'sunset', 'eyYellow'];

async function screenshotAllThemes() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewportSize({ width: 1400, height: 900 });
  
  // Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  // Wait for content to load
  await page.waitForTimeout(1000);
  
  for (const theme of themes) {
    // Click on the theme button
    const themeButton = page.locator(`button:has-text("${getThemeName(theme)}")`);
    await themeButton.click();
    
    // Wait for transition
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({ 
      path: `theme-${theme}.png`,
      fullPage: false 
    });
    
    console.log(`Screenshot saved: theme-${theme}.png`);
  }
  
  await browser.close();
  console.log('\nAll theme screenshots saved!');
}

function getThemeName(theme) {
  const names = {
    green: 'Green',
    blue: 'Ocean Blue',
    purple: 'Royal Purple',
    teal: 'Fresh Teal',
    sunset: 'Sunset',
    eyYellow: 'EY Classic'
  };
  return names[theme];
}

screenshotAllThemes().catch(console.error);

