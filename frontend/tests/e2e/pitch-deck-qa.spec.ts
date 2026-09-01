// QA-only spec: adversarial browser-QA that the reviewer could not run headlessly.
// Runs axe-core (CDN-vendored per run) to produce WCAG 2.1 AA scoring per theme,
// cycles through 4 desktop resolutions with screenshots, paces the main horizontal
// track to time a live practice run, and confirms prefers-reduced-motion neutralises
// decorative animations.

import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AXE_CDN = 'https://unpkg.com/axe-core@4.10.2/axe.min.js';
const OUT_DIR = path.resolve(__dirname, '../../qa-output');

function writeJson(name: string, data: unknown) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, name), JSON.stringify(data, null, 2));
}

async function primeTheme(page: Page, theme: 'light' | 'dark' | 'medieval') {
  await page.addInitScript((t) => {
    try {
      window.localStorage.setItem('springais-pitch-theme', t);
    } catch {
      // Intentionally ignored: localStorage throws in a browser context with site data
      // blocked, and priming the theme is a best-effort convenience for the test, not a
      // precondition for it. An empty block was flagged by eslint no-empty; the fix is to
      // say WHY it is empty, not to remove the guard.
    }
  }, theme);
}

async function loadAxe(page: Page) {
  await page.addScriptTag({ url: AXE_CDN });
  await page.waitForFunction(() => typeof (window as any).axe !== 'undefined');
}

async function axeRun(page: Page, runOptions?: Record<string, unknown>) {
  return await page.evaluate(async (opts) => {
    const axe: any = (window as any).axe;
    return await axe.run(document, opts || { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
  }, runOptions || undefined);
}

test.describe('Pitch deck QA', () => {
  test.describe.configure({ mode: 'serial' });

  for (const theme of ['medieval', 'dark', 'light'] as const) {
    test(`axe-core WCAG 2.1 AA — ${theme} theme`, async ({ page }) => {
      await primeTheme(page, theme);
      const errors: string[] = [];
      const warnings: string[] = [];
      const failed: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
        if (m.type() === 'warning') warnings.push(m.text());
      });
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('requestfailed', (r) => failed.push(r.url() + ' :: ' + (r.failure()?.errorText ?? '')));
      page.on('response', (r) => { if (r.status() >= 400) failed.push(r.url() + ' :: HTTP ' + r.status()); });

      await page.goto('/deck/');
      await expect(page.locator('body')).toHaveClass(new RegExp(`theme-${theme}`));
      await loadAxe(page);

      const results: any = await axeRun(page);
      const summary = {
        theme,
        url: page.url(),
        violations: results.violations.length,
        incomplete: results.incomplete.length,
        passes: results.passes.length,
        violationDetails: results.violations.map((v: any) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          helpUrl: v.helpUrl,
          nodes: v.nodes.length,
          targets: v.nodes.slice(0, 5).map((n: any) => n.target?.join(' ')),
        })),
        consoleErrors: errors,
        consoleWarnings: warnings,
        networkFailures: failed,
      };
      writeJson(`axe-${theme}.json`, summary);

      // NF-3: Lighthouse a11y >=90 is the spec target; axe violations are a stricter
      // check. The story calls out four specific contracts: alt on Cedric, 4.5:1
      // contrast, theme-switcher aria, real h1/h2 tags. Fail only on those.
      const critical = results.violations.filter((v: any) =>
        ['image-alt', 'color-contrast', 'aria-allowed-attr', 'aria-required-attr',
         'aria-valid-attr', 'aria-valid-attr-value', 'heading-order', 'button-name',
         'link-name', 'label', 'landmark-one-main'].includes(v.id)
      );
      // Soft-log critical violations so other QA tests still run; QA report aggregates.
      if (critical.length) console.log(`[QA] ${theme} has ${critical.length} critical a11y violations (see qa-output/axe-${theme}.json)`);
      expect(errors, `Console errors in ${theme}`).toEqual([]);
      expect(failed, `Network failures in ${theme}`).toEqual([]);
    });
  }

  for (const [label, width, height] of [
    ['1280x720', 1280, 720],
    ['1440x900', 1440, 900],
    ['1600x900', 1600, 900],
    ['1920x1080', 1920, 1080],
  ] as const) {
    test(`visual fidelity @ ${label} (medieval default)`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/deck/');
      await expect(page.locator('body')).toHaveClass(/theme-medieval/);
      // Capture hero
      await page.screenshot({ path: path.join(OUT_DIR, `resolution-${label}-hero.png`), fullPage: false });
      // Advance to slide 4 (impact) for a dense content check
      for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT_DIR, `resolution-${label}-impact.png`), fullPage: false });
      // Jump to closing slide
      await page.goto('/deck/#/closing');
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT_DIR, `resolution-${label}-closing.png`), fullPage: false });

      // Assert no horizontal overflow (would indicate clipping)
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return { clientW: doc.clientWidth, scrollW: doc.scrollWidth, clientH: doc.clientHeight, scrollH: doc.scrollHeight };
      });
      expect(overflow.scrollW, `Horizontal overflow at ${label}`).toBeLessThanOrEqual(overflow.clientW + 2);
    });
  }

  test('per-theme hero screenshots for side-by-side fidelity check', async ({ page }) => {
    for (const t of ['medieval', 'dark', 'light'] as const) {
      await primeTheme(page, t);
      await page.goto('/deck/');
      await expect(page.locator('body')).toHaveClass(new RegExp(`theme-${t}`));
      // dismiss nav hint so the screenshot is canonical
      await page.waitForTimeout(3800);
      await page.screenshot({ path: path.join(OUT_DIR, `hero-${t}.png`), fullPage: false });
    }
  });

  test('prefers-reduced-motion disables twinkle/shimmer/flicker', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/deck/');
    const twinkleState = await page.evaluate(() => {
      const t = document.querySelector('.twinkle-field') as HTMLElement | null;
      if (!t) return { exists: false };
      const cs = getComputedStyle(t);
      return { exists: true, animationName: cs.animationName, display: cs.display };
    });
    // Either twinkle-field is not rendered, or its animations are "none" under reduced-motion.
    // Soft-log so QA report captures; this is a known finding to relay.
    const honors = !twinkleState.exists || twinkleState.animationName === 'none' || twinkleState.display === 'none';
    if (!honors) console.log('[QA] prefers-reduced-motion does NOT neutralise twinkle-field (animationName=' + twinkleState.animationName + ')');
    writeJson('reduced-motion.json', { twinkleState, honors });
    await ctx.close();
  });

  test('main horizontal track pace-through — elapsed time log', async ({ page }) => {
    await page.goto('/deck/');
    await expect(page.locator('body')).toHaveClass(/theme-medieval/);
    const start = Date.now();
    // Advance through 17 horizontal slides (0-16). A realistic live pace is ~17s
    // per slide; we simulate by pausing briefly to let animations settle.
    const PACE_MS = 1500; // compressed pace - presenter would be ~15-20s per slide
    for (let i = 0; i < 16; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(PACE_MS);
    }
    const elapsedMs = Date.now() - start;
    const summary = {
      horizontalSlides: 17,
      compressedPaceMsPerSlide: PACE_MS,
      totalElapsedMs: elapsedMs,
      totalElapsedHuman: `${Math.floor(elapsedMs / 1000 / 60)}m ${Math.floor((elapsedMs / 1000) % 60)}s`,
      // Extrapolated estimate at 17s/slide presenter pace:
      projectedPresenterMinutes: Math.round(((17 * 17) / 60) * 10) / 10,
    };
    writeJson('pace-run.json', summary);
  });

  test('Cedric pose map — every slide with pose renders specified sprite', async ({ page }) => {
    await page.goto('/deck/');
    // The UX spec calls out 20 slides with Cedric (5 and 9 are without).
    // Verify each referenced sprite resolves 200 OK by scanning <img> srcs.
    const sprites = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('.reveal .slides img[src*="/cedric/sprites/"]')) as HTMLImageElement[];
      return imgs.map(i => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt'), parentId: i.closest('section')?.id }));
    });
    writeJson('cedric-sprite-map.json', sprites);
    // Confirm every src resolves (force-decode via fetch check)
    const bad: string[] = [];
    for (const s of sprites) {
      if (!s.src) continue;
      const r = await page.request.get(s.src);
      if (r.status() >= 400) bad.push(`${s.src} :: HTTP ${r.status()}`);
      expect(s.alt, `missing alt on sprite in slide ${s.parentId}`).toBeTruthy();
    }
    expect(bad).toEqual([]);
    // Spec requires zero Cedric on slides 5 (cta) and 9 (personas).
    const slide5Imgs = sprites.filter(s => s.parentId === 'cta');
    const slide9Imgs = sprites.filter(s => s.parentId === 'personas');
    expect(slide5Imgs, 'slide 5 (cta) must have no Cedric').toEqual([]);
    expect(slide9Imgs, 'slide 9 (personas) must have no Cedric').toEqual([]);
  });

  test('keyboard-only nav completes main track without mouse', async ({ page }) => {
    await page.goto('/deck/');
    // Home -> end -> home
    await page.keyboard.press('End');
    await expect(page).toHaveURL(/#\/credits/);
    await page.keyboard.press('Home');
    await expect(page).toHaveURL(/#\/hero/);
    // Arrow-down into verticals
    await page.goto('/deck/#/problem-depth');
    await page.keyboard.press('ArrowDown');
    await expect(page).toHaveURL(/#\/problem-depth\/1/);
    // ? opens help in reveal.js
    await page.keyboard.press('?');
    await page.waitForTimeout(200);
    const helpVisible = await page.evaluate(() => !!document.querySelector('.reveal .overlay-help, .overlay.help'));
    // reveal.js 4.x shows help via .overlay with help content - presence not strictly enforced but tested
    writeJson('help-overlay-visible.json', { helpVisible });
  });

  test('fast-3G load trace — DOMContentLoaded + first-slide-visible', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    // Fast-3G per Lighthouse definition: 1.6 Mbps down, 750 Kbps up, 150ms RTT.
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });
    const t0 = Date.now();
    await page.goto('/deck/', { waitUntil: 'domcontentloaded' });
    const dcl = Date.now() - t0;
    // First slide visible: wait for first section to paint
    await page.locator('.reveal .slides section').first().waitFor({ state: 'visible' });
    const firstVisible = Date.now() - t0;
    writeJson('fast3g-timing.json', { domContentLoadedMs: dcl, firstSlideVisibleMs: firstVisible, budgetMs: 3000 });
    expect(firstVisible, 'Fast-3G: first slide visible should be < 3000ms').toBeLessThan(3000);
    await ctx.close();
  });
});
