import { test, expect, type Page } from '@playwright/test';

/**
 * Expected count of main-track (horizontal) slides in the deck.
 * If the UX spec grows the deck, bump this number deliberately --
 * the story's AC-5 treats the count as a contract.
 */
const EXPECTED_HORIZONTAL_SLIDES = 17;

async function gotoDeck(page: Page) {
  await page.goto('/deck/');
  // Wait for reveal.js to finish initialization + first hashchange.
  await page.waitForFunction(() => {
    const w = window as unknown as { Reveal?: { isReady?: () => boolean } };
    return typeof w.Reveal !== 'undefined' && w.Reveal.isReady?.() === true;
  });
}

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
    // reveal.js init may append #/hero (or another slide id) after hash:true boot.
    expect(deckPage.url()).toMatch(/\/deck\/?(#.*)?$/);
  });

  test('deck loads at /deck/ with medieval theme by default', async ({ page }) => {
    await gotoDeck(page);
    await expect(page.locator('body')).toHaveClass(/theme-medieval/);
    await expect(page.locator('.reveal .slides section').first()).toBeVisible();
  });

  test('theme switcher cycles all three themes via keyboard', async ({ page }) => {
    await gotoDeck(page);
    await page.keyboard.press('1');
    await expect(page.locator('body')).toHaveClass(/theme-light/);
    await page.keyboard.press('2');
    await expect(page.locator('body')).toHaveClass(/theme-dark/);
    await page.keyboard.press('3');
    await expect(page.locator('body')).toHaveClass(/theme-medieval/);
  });

  test('theme switcher cycles all three themes via UI buttons', async ({ page }) => {
    await gotoDeck(page);
    await page.getByRole('button', { name: /light theme/i }).click();
    await expect(page.locator('body')).toHaveClass(/theme-light/);
    await page.getByRole('button', { name: /dark theme/i }).click();
    await expect(page.locator('body')).toHaveClass(/theme-dark/);
    await page.getByRole('button', { name: /medieval theme/i }).click();
    await expect(page.locator('body')).toHaveClass(/theme-medieval/);
  });

  test('all 17 horizontal slides render without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await gotoDeck(page);

    const totalSlides = await page.locator('.reveal .slides > section').count();
    expect(totalSlides).toBe(EXPECTED_HORIZONTAL_SLIDES);

    // Walk the entire main track via reveal.js API (no vertical drift).
    for (let i = 0; i < totalSlides; i++) {
      await page.evaluate((idx) => {
        const w = window as unknown as { Reveal: { slide: (h: number, v?: number) => void } };
        w.Reveal.slide(idx, 0);
      }, i);
      await page.waitForTimeout(80);
    }
    expect(errors).toEqual([]);
  });

  test('nested vertical slides are reachable via ArrowDown on depth slides', async ({ page }) => {
    await gotoDeck(page);
    // Jump straight to problem-depth (slide 7) horizontally.
    await page.evaluate(() => {
      const w = window as unknown as { Reveal: { slide: (h: number, v?: number) => void } };
      w.Reveal.slide(7, 0);
    });
    await page.waitForTimeout(100);
    const indicesBefore = await page.evaluate(() => {
      const w = window as unknown as { Reveal: { getIndices: () => { h: number; v: number } } };
      return w.Reveal.getIndices();
    });
    expect(indicesBefore.h).toBe(7);
    expect(indicesBefore.v).toBe(0);

    // Press Down in a loop. Slide 7 main has 4 fragment bullets, so reveal.js
    // consumes fragments first and only advances to v=1 after they are
    // exhausted. That's correct user-nav semantics. A bounded loop catches
    // the transition regardless of how many fragments the slide currently has.
    for (let step = 0; step < 10; step++) {
      await page.evaluate(() => {
        const w = window as unknown as { Reveal: { down: () => void } };
        w.Reveal.down();
      });
      await page.waitForTimeout(100);
      const v = await page.evaluate(() => {
        const w = window as unknown as { Reveal: { getIndices: () => { v: number } } };
        return w.Reveal.getIndices().v;
      });
      if (v >= 1) break;
    }

    const indicesAfter = await page.evaluate(() => {
      const w = window as unknown as { Reveal: { getIndices: () => { h: number; v: number } } };
      return w.Reveal.getIndices();
    });
    expect(indicesAfter.h).toBe(7);
    expect(indicesAfter.v).toBe(1);
  });

  test('deep-link hash resolves to the target slide', async ({ page }) => {
    await page.goto('/deck/#/closing');
    await page.waitForFunction(() => {
      const w = window as unknown as { Reveal?: { isReady?: () => boolean } };
      return typeof w.Reveal !== 'undefined' && w.Reveal.isReady?.() === true;
    });
    // Give reveal.js a tick to consume the hash and move to the target slide.
    await page.waitForTimeout(200);
    const id = await page.evaluate(() => {
      const w = window as unknown as {
        Reveal: { getCurrentSlide: () => HTMLElement | null };
      };
      const slide = w.Reveal.getCurrentSlide();
      return slide?.id || slide?.parentElement?.id || '';
    });
    expect(id).toBe('closing');
  });

  test('Cedric sprites render with non-empty alt text and load successfully', async ({ page }) => {
    await gotoDeck(page);

    // Assert on the currently-visible slide's sprites rather than the whole deck:
    // off-screen sprites use loading="lazy" and may not have decoded yet on
    // a cold page load. Use decode() for deterministic readiness.
    const visibleSlide = page.locator('.reveal .slides > section.present').first();
    await expect(visibleSlide).toBeVisible();

    const sprites = visibleSlide.locator('img[src*="/cedric/sprites/"]');
    const count = await sprites.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const img = sprites.nth(i);
      await expect(img).toHaveAttribute('alt', /.+/);
      const ok = await img.evaluate(async (el: HTMLImageElement) => {
        try {
          await el.decode();
          return el.naturalWidth > 0;
        } catch {
          return false;
        }
      });
      expect(ok).toBe(true);
    }
  });

  test('exit button returns to login', async ({ page }) => {
    await gotoDeck(page);
    await page.getByRole('link', { name: /back to login/i }).click();
    await expect(page).toHaveURL(/\/(login)?$/);
  });

  test('theme preference persists across reloads', async ({ page }) => {
    await gotoDeck(page);
    await page.keyboard.press('1');
    await expect(page.locator('body')).toHaveClass(/theme-light/);
    await page.reload();
    await expect(page.locator('body')).toHaveClass(/theme-light/);
  });
});
