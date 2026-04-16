import { test, expect } from '@playwright/test';

test.describe('Pitch deck', () => {
  test('link on login page opens deck in new tab', async ({ context, page }) => {
    await page.goto('/login');
    const deckLink = page.getByRole('link', { name: /view the skillbridge pitch deck/i });
    await expect(deckLink).toBeVisible();
    const [deckPage] = await Promise.all([
      context.waitForEvent('page'),
      deckLink.click(),
    ]);
    await deckPage.waitForLoadState('domcontentloaded');
    expect(deckPage.url()).toMatch(/\/deck\/?$/);
  });

  test('deck loads at /deck/ with medieval theme by default', async ({ page }) => {
    await page.goto('/deck/');
    await expect(page.locator('body')).toHaveClass(/theme-medieval/);
    await expect(page.locator('.reveal .slides section').first()).toBeVisible();
  });

  test('theme switcher cycles all three themes via keyboard', async ({ page }) => {
    await page.goto('/deck/');
    await page.keyboard.press('1');
    await expect(page.locator('body')).toHaveClass(/theme-light/);
    await page.keyboard.press('2');
    await expect(page.locator('body')).toHaveClass(/theme-dark/);
    await page.keyboard.press('3');
    await expect(page.locator('body')).toHaveClass(/theme-medieval/);
  });

  test('theme switcher cycles all three themes via UI buttons', async ({ page }) => {
    await page.goto('/deck/');
    await page.getByRole('button', { name: /light theme/i }).click();
    await expect(page.locator('body')).toHaveClass(/theme-light/);
    await page.getByRole('button', { name: /dark theme/i }).click();
    await expect(page.locator('body')).toHaveClass(/theme-dark/);
    await page.getByRole('button', { name: /medieval theme/i }).click();
    await expect(page.locator('body')).toHaveClass(/theme-medieval/);
  });

  test('all slides render without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/deck/');
    const totalSlides = await page.locator('.reveal .slides > section').count();
    expect(totalSlides).toBeGreaterThan(1);
    for (let i = 0; i < totalSlides + 4; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(120);
    }
    expect(errors).toEqual([]);
  });

  test('Cedric sprites render with non-empty alt text and load successfully', async ({ page }) => {
    await page.goto('/deck/');
    const sprites = page.locator('img[src*="/cedric/sprites/"]');
    const count = await sprites.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const img = sprites.nth(i);
      await expect(img).toHaveAttribute('alt', /.+/);
      const natural = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(natural).toBeGreaterThan(0);
    }
  });

  test('exit button returns to login', async ({ page }) => {
    await page.goto('/deck/');
    await page.getByRole('link', { name: /back to login/i }).click();
    await expect(page).toHaveURL(/\/(login)?$/);
  });

  test('theme preference persists across reloads', async ({ page }) => {
    await page.goto('/deck/');
    await page.keyboard.press('1');
    await expect(page.locator('body')).toHaveClass(/theme-light/);
    await page.reload();
    await expect(page.locator('body')).toHaveClass(/theme-light/);
  });
});
