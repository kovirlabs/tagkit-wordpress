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
