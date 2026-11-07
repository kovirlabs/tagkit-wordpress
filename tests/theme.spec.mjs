import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { checkFiles } from '@kovirlabs/tagcheck';

const BASE = process.env.WP_URL ?? 'http://localhost:8888';
const up = await fetch(BASE).then((r) => r.ok).catch(() => false);
test.skip(!up, `WordPress isn't running at ${BASE} (see tests/wp/docker-compose.yml)`);

// Pages the theme renders with no author-chosen content around them.
const THEME_PAGES = ['/', '/?s=lorem', '/?s=zzzz-no-results', '/this-page-does-not-exist/', '/hello-world/', '/category/uncategorized/'];

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  execFileSync(process.execPath, ['scripts/crawl.mjs', BASE, 'test-results/pages'], { stdio: 'pipe' });
});

test('every page of the Theme Unit Test content fits a phone (no sideways scrolling)', async () => {
  const pages = readdirSync('test-results/pages').map((f) => `test-results/pages/${f}`);
  expect(pages.length).toBeGreaterThan(100);
  const report = await checkFiles(pages, { browser: true, ignore: ['unknown-class', 'style-block', 'inline-style', 'empty-link', 'duplicate-id', 'heading-skip', 'missing-alt', 'contrast'] });
  expect(report.files.flatMap((f) => f.problems.map((p) => `${f.file}: ${p.message}`))).toEqual([]);
});

test('pages the theme renders itself have no TagCheck errors and meet WCAG AA contrast', async () => {
  const files = [];
  const { writeFileSync, mkdirSync } = await import('node:fs');
  mkdirSync('test-results/theme-pages', { recursive: true });
  for (const [i, path] of THEME_PAGES.entries()) {
    const file = `test-results/theme-pages/page-${i}.html`;
    writeFileSync(file, await (await fetch(BASE + path)).text()); // the HTML WordPress serves, before TagAction runs
    files.push(file);
  }
  // WordPress's own classes and inline styles are expected; errors are not.
  const report = await checkFiles(files, { browser: true, ignore: ['unknown-class', 'style-block', 'inline-style'] });
  expect(report.files.flatMap((f) => f.problems.map((p) => `${THEME_PAGES[Number(f.file.match(/page-(\d+)/)[1])]}: ${p.rule}: ${p.message}`))).toEqual([]);
});

test('text the theme colors meets WCAG AA in light and dark mode on every page', async ({ browser }) => {
  const names = readdirSync('test-results/pages').map((f) => f.replace(/\.html$/, ''));
  const failures = [];
  for (const scheme of ['light', 'dark']) {
    const page = await browser.newPage({ colorScheme: scheme });
    for (const name of names) {
      const path = name === 'home' ? '/' : name.startsWith('s-') ? `/?s=${name.slice(2)}` : `/${name}/`;
      if (!(await page.goto(path).catch(() => null))) continue;
      const bad = await page.evaluate(() => {
        const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
        const rgba = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data; return [r, g, b, a / 255]; };
        const over = (t, u) => t.slice(0, 3).map((c, i) => c * t[3] + u[i] * (1 - t[3])).concat(1);
        const root = rgba(getComputedStyle(document.documentElement).backgroundColor);
        const bg = (el) => { const L = []; for (let n = el; n; n = n.parentElement) { const x = rgba(getComputedStyle(n).backgroundColor); if (x[3] > 0) L.push(x); if (x[3] === 1) break; } return L.reduceRight((d, l) => over(l, d), root[3] ? root : [255, 255, 255, 1]); };
        const lum = ([r, g, b]) => { const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
        // Skip colors the author chose, text over images, and screen-reader-only text.
        const skip = '[style*="color"], [class*="has-"][class*="-color"], .wp-block-cover, .wp-block-gallery, .wp-block-media-text, .wp-block-image, mark, .wp-block-pullquote, [class*="is-style-"], .screen-reader-text, .mejs-offscreen, :disabled';
        return [...document.querySelectorAll('body *')]
          .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && el.checkVisibility() && !el.closest(skip))
          .map((el) => { const B = bg(el); const F = over(rgba(getComputedStyle(el).color), B); const [h, l] = [lum(F), lum(B)].sort((a, b) => b - a); return [`${el.localName}.${[...el.classList].slice(0, 2).join('.')}`, Math.round(((h + 0.05) / (l + 0.05)) * 100) / 100]; })
          .filter(([, ratio]) => ratio < 4.5);
      });
      for (const [el, ratio] of bad) failures.push(`${scheme} ${path} ${el} ${ratio}:1`);
    }
    await page.close();
  }
  expect(failures).toEqual([]);
});

test('TagAction loads where content uses it, and not on the posts list', async ({ page }) => {
  await page.goto('/markup-html-tags-and-formatting/');
  await expect(page.locator('script[src*="tagaction"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Copy' }).first()).toBeVisible();
  await expect(page.locator('main table th button[data-tag="sort"]').first()).toBeAttached();
  await page.goto('/');
  await expect(page.locator('script[src*="tagaction"]')).toHaveCount(0);
});

test('the Site Editor primary color drives TagBrush.css', async ({ page }) => {
  await page.goto('/hello-world/');
  await page.evaluate(() => document.documentElement.style.setProperty('--wp--preset--color--primary', '#db2777'));
  const link = await page.evaluate(() => { const a = document.createElement('button'); a.className = 'wp-element-button'; document.querySelector('main').append(a); return getComputedStyle(a).backgroundColor; });
  expect(link).toBe('rgb(219, 39, 119)');
});

test('header, main, and footer are laid out like TagBrush.css pages, with a skip link', async ({ page }) => {
  await page.goto('/hello-world/');
  const box = (selector) => page.locator(selector).first().evaluate((el) => { const s = getComputedStyle(el); return { top: s.borderTopWidth, bottom: s.borderBottomWidth }; });
  expect((await box('.wp-site-blocks > header')).bottom).toBe('1px');
  expect((await box('.wp-site-blocks > footer')).top).toBe('1px');
  await expect(page.locator('.skip-link')).toHaveAttribute('href', /#/);
  await expect(page.locator('main article h1')).toHaveText('Hello world!');
});
