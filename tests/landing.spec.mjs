import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { measureLanding, score } from './landing-checks.mjs';

// A landing page made only of core blocks (tests/wp/landing.html): full-width
// hero, wide feature row, colored quote band, pricing, FAQ, posts, gallery.
// scripts/compete.mjs runs the same checks on WordPress's default theme and on
// Hello Elementor; here TagKit has to pass all of them.
const BASE = process.env.WP_URL ?? 'http://localhost:8888';
const up = await fetch(BASE).then((r) => r.ok).catch(() => false);
test.skip(!up, `WordPress isn't running at ${BASE} (see tests/wp/docker-compose.yml)`);

const wp = (...args) => execFileSync('docker', ['compose', '-f', 'tests/wp/docker-compose.yml', 'exec', '-T', 'cli', 'wp', ...args], { encoding: 'utf8' }).trim();

test.describe.configure({ mode: 'serial' });

test.describe('landing page as the front page', () => {
  test.beforeAll(() => {
    wp('option', 'update', 'page_on_front', wp('post', 'list', '--post_type=page', '--name=landing', '--field=ID'));
    wp('option', 'update', 'show_on_front', 'page');
  });
  test.afterAll(() => wp('option', 'update', 'show_on_front', 'posts'));

  test('passes every landing-page check', async ({ browser }) => {
    const result = await measureLanding(browser, `${BASE}/`);
    const { checks } = score(result);
    // Speed depends on the machine running the tests, so it's reported, not required here.
    const failed = checks.filter(([name, ok]) => !ok && !name.startsWith('Largest paint')).map(([name, , detail]) => `${name}${detail ? ` (${detail})` : ''}`);
    expect(failed, JSON.stringify({ light: result.desktop.contrast, dark: result.dark.contrast, tagcheck: result.tagcheck.errors }, null, 1)).toEqual([]);
  });

  test('sections have room: the hero meets the header, and content doesn\'t touch the colored band', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const m = await page.evaluate(() => {
      const box = (s) => document.querySelector(s).getBoundingClientRect();
      const h2 = [...document.querySelectorAll('.wp-block-post-content > h2')].find((h) => h.textContent === 'Why teams switch');
      return {
        header: box('.wp-site-blocks > header').bottom,
        hero: box('.wp-block-cover.alignfull').top,
        mediaBottom: box('.wp-block-media-text').bottom,
        band: box('.wp-block-group.alignfull.has-background').top,
        headingToRow: h2.nextElementSibling.getBoundingClientRect().top - h2.getBoundingClientRect().bottom,
      };
    });
    expect(Math.round(m.hero - m.header)).toBe(0);
    expect(m.band - m.mediaBottom).toBeGreaterThanOrEqual(48);
    expect(m.headingToRow).toBeLessThanOrEqual(32);
  });

  test('pricing cards are the same height, with their headings and buttons lined up', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const cards = page.locator('.wp-block-column:is(.is-style-card, .is-style-card-featured)');
    await expect(cards).toHaveCount(3);
    const m = await cards.evaluateAll((els) => els.map((el) => {
      const r = (s) => el.querySelector(s).getBoundingClientRect();
      return { height: el.getBoundingClientRect().height, heading: r('h3').top, button: r('.wp-block-button__link').bottom, buttonHeight: r('.wp-block-button__link').height, padding: getComputedStyle(el).paddingTop };
    }));
    for (const key of ['height', 'heading', 'button', 'buttonHeight']) {
      const values = m.map((c) => Math.round(c[key]));
      expect(Math.max(...values) - Math.min(...values), `${key}: ${values}`).toBeLessThanOrEqual(1);
    }
    expect(parseFloat(m[0].padding)).toBeGreaterThan(0);
    await expect(page.locator('.is-style-card-featured > p').first()).toHaveText('Most popular');
  });

  test('headings use the bundled heading font', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const font = await page.evaluate(() => ({
      family: getComputedStyle(document.querySelector('h2')).fontFamily,
      loaded: [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Bricolage Grotesque' && f.status === 'loaded'),
      body: getComputedStyle(document.querySelector('.wp-block-post-content p')).fontFamily,
    }));
    expect(font.family).toMatch(/^"?Bricolage Grotesque/);
    expect(font.loaded).toBe(true);
    expect(font.body).not.toMatch(/Bricolage/);
  });

  test('the front page shows the page without its title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Readable reports from any CSV');
  });
});

test('with the latest posts on the front page, the posts list is shown, not the front-page template', async ({ page }) => {
  expect(wp('option', 'get', 'show_on_front')).toBe('posts');
  await page.goto('/');
  await expect(page.locator('main .wp-block-post-template')).toBeVisible();
});

test('on an ordinary page, wide and full-width blocks still break out of the text column', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/landing/');
  await expect(page.locator('main h1').first()).toHaveText('Landing');
  const widths = await page.evaluate(() => ({
    window: document.documentElement.clientWidth,
    cover: document.querySelector('.wp-block-cover.alignfull').getBoundingClientRect().width,
    columns: document.querySelector('.wp-block-columns.alignwide').getBoundingClientRect().width,
    text: document.querySelector('.wp-block-post-content > details').getBoundingClientRect().width,
  }));
  expect(widths.cover).toBe(widths.window);
  expect(widths.columns).toBeGreaterThan(widths.text + 200);
});

test('the reading width is the same for headings and text (rem, not ch)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/landing/');
  const [h2, details] = await page.evaluate(() => ['h2', 'details'].map((t) => { const r = document.querySelector(`.wp-block-post-content > ${t}`).getBoundingClientRect(); return [Math.round(r.left), Math.round(r.width)]; }));
  expect(h2).toEqual(details);
});
