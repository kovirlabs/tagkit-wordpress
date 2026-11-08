// Measures a landing page the way a visitor experiences it. Used by
// tests/landing.spec.mjs (TagKit must pass) and scripts/compete.mjs (TagKit
// against WordPress's default theme and Hello Elementor on the same page).
//
// The page is the one in tests/wp/landing.html (core blocks) or
// tests/wp/landing-elementor.json (the same page built with Elementor): a hero
// with an <h1>, three features, an image beside text, a quote on a colored
// band, pricing, two FAQ questions, recent posts, and a row of images.
import { checkFiles } from '@kovirlabs/tagcheck';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The second question: it starts closed everywhere (Elementor opens the first by default).
const QUESTION = 'Can I cancel any time?';
const ANSWER = 'billed again';

// Layout, contrast, and headings, measured inside the page.
function inspect() {
  const vw = document.documentElement.clientWidth;
  const visible = (el) => el.checkVisibility() && el.getClientRects().length > 0;
  // The innermost element with the text (ancestors come first in document order).
  const byText = (sel, text) => [...document.querySelectorAll(sel)].findLast((el) => el.textContent.includes(text) && visible(el));
  // The outermost block around an element that is still inside the page's main content.
  const block = (el) => { let b = el; for (let n = el.parentElement; n && !n.matches('main, body, .entry-content, .elementor, .wp-block-post-content, .page-content'); n = n.parentElement) b = n; return b; };
  const fullBleed = (el) => { if (!el) return false; const r = block(el).getBoundingClientRect(); return Math.abs(r.left) < 1 && Math.abs(r.width - vw) < 1; };

  const h1 = [...document.querySelectorAll('h1')].filter(visible);
  const first = byText('h3, h2, p, div', 'Two minutes, start to finish');
  const third = byText('h3, h2', 'Your data stays yours');
  const rowSpan = first && third ? Math.round(third.parentElement.getBoundingClientRect().right - first.getBoundingClientRect().left) : 0;

  // Characters per line in the page's paragraphs (the longest line wins).
  let maxChars = 0;
  for (const p of document.querySelectorAll('main p, .elementor p, .entry-content p')) {
    if (!visible(p)) continue;
    const lh = parseFloat(getComputedStyle(p).lineHeight) || parseFloat(getComputedStyle(p).fontSize) * 1.5;
    const lines = Math.round(p.getBoundingClientRect().height / lh);
    if (lines > 1) maxChars = Math.max(maxChars, Math.round(p.textContent.trim().length / lines));
  }

  const questions = [...document.querySelectorAll('h2')].find((h) => h.textContent.trim() === 'Questions' && visible(h));
  const faq = byText('summary, button, [role="button"], .e-n-accordion-item-title', 'Is there a free plan?');
  const item = faq && (faq.closest('details, .e-n-accordion-item, .elementor-accordion-item, .elementor-toggle-item') ?? faq);
  const headingOffset = questions && item ? Math.round(Math.abs(questions.getBoundingClientRect().left - item.getBoundingClientRect().left)) : null;

  // WCAG AA contrast for text that isn't over an image.
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgba = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data; return [r, g, b, a / 255]; };
  const over = (t, u) => t.slice(0, 3).map((c, i) => c * t[3] + u[i] * (1 - t[3])).concat(1);
  const overImage = (el) => { for (let n = el; n; n = n.parentElement) { if (n.matches('.wp-block-cover') || getComputedStyle(n).backgroundImage !== 'none') return true; } return false; };
  const bg = (el) => { const L = []; for (let n = el; n; n = n.parentElement) { const x = rgba(getComputedStyle(n).backgroundColor); if (x[3] > 0) L.push(x); if (x[3] === 1) break; } return L.reduceRight((d, l) => over(l, d), [255, 255, 255, 1]); };
  const lum = ([r, g, b]) => { const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const contrast = [...document.querySelectorAll('body *')]
    .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && visible(el) && !el.closest('.screen-reader-text, .elementor-screen-only') && !overImage(el))
    .map((el) => { const s = getComputedStyle(el); const big = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && Number(s.fontWeight) >= 700); const B = bg(el); const F = over(rgba(s.color), B); const [h, l] = [lum(F), lum(B)].sort((a, b) => b - a); return { text: el.textContent.trim().slice(0, 40), ratio: Math.round(((h + 0.05) / (l + 0.05)) * 100) / 100, need: big ? 3 : 4.5 }; })
    .filter((x) => x.ratio < x.need)
    .map((x) => `"${x.text}" ${x.ratio}:1`);

  let depth = 0;
  for (const el of document.querySelectorAll('body *')) { let d = 0; for (let n = el; n; n = n.parentElement) d++; depth = Math.max(depth, d); }

  return {
    h1: h1.length,
    heroFullBleed: fullBleed(h1.find((h) => h.textContent.includes('Readable reports'))),
    bandFullBleed: fullBleed(byText('p, blockquote, div', '40-tab spreadsheet')),
    rowSpan,
    maxChars,
    headingOffset,
    contrast,
    sideways: document.documentElement.scrollWidth > vw,
    background: getComputedStyle(document.body).backgroundColor,
    domNodes: document.querySelectorAll('*').length,
    domDepth: depth,
  };
}

// Opens the FAQ's first question and reports whether its answer shows.
async function faqOpens(page, how) {
  const q = page.getByText(QUESTION, { exact: true }).first();
  if (how === 'keyboard') {
    await q.evaluate((el) => (el.closest('summary, button, [role="button"], a, [tabindex]') ?? el).focus());
    const focused = await page.evaluate(() => document.activeElement !== document.body);
    if (!focused) return false;
    await page.keyboard.press('Enter');
  } else {
    await q.click();
  }
  await page.waitForTimeout(600);
  return page.getByText(ANSWER).first().isVisible();
}

export async function measureLanding(browser, url, { screenshots } = {}) {
  const result = { url };

  // Desktop, light: layout, weight, and the HTML for TagCheck.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
    const page = await context.newPage();
    const weight = { requests: 0, html: 0, css: 0, js: 0, font: 0, image: 0, other: 0 };
    page.on('response', async (res) => {
      const type = res.request().resourceType();
      const size = (await res.body().catch(() => Buffer.alloc(0))).length;
      weight.requests++;
      const key = { document: 'html', stylesheet: 'css', script: 'js', font: 'font', image: 'image' }[type] ?? 'other';
      weight[key] += size;
    });
    const html = await (await page.goto(url, { waitUntil: 'networkidle' })).text();
    result.desktop = await page.evaluate(inspect);
    result.weight = Object.fromEntries(Object.entries(weight).map(([k, v]) => [k, k === 'requests' ? v : Math.round(v / 1024)]));
    result.keyboardFaq = await faqOpens(page, 'keyboard');
    if (screenshots) await page.screenshot({ path: `${screenshots}-desktop.png`, fullPage: true });
    await context.close();

    const dir = mkdtempSync(join(tmpdir(), 'landing-'));
    writeFileSync(join(dir, 'page.html'), html);
    const report = await checkFiles([join(dir, 'page.html')], { ignore: ['unknown-class', 'style-block', 'inline-style'] });
    const problems = report.files.flatMap((f) => f.problems);
    result.tagcheck = { errors: problems.filter((p) => p.severity === 'error').map((p) => `${p.rule}: ${p.message}`), warnings: problems.filter((p) => p.severity !== 'error').length };
  }

  // Dark mode: does the page follow the reader's system setting, and stay readable?
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    result.dark = await page.evaluate(inspect);
    result.followsDarkMode = result.dark.background !== result.desktop.background;
    if (screenshots) await page.screenshot({ path: `${screenshots}-dark.png`, fullPage: true });
    await context.close();
  }

  // Phone.
  {
    const context = await browser.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    result.phone = await page.evaluate(inspect);
    if (screenshots) await page.screenshot({ path: `${screenshots}-phone.png`, fullPage: true });
    await context.close();
  }

  // JavaScript off: the FAQ still opens.
  {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    result.noJsFaq = await faqOpens(page, 'click');
    await context.close();
  }

  // Speed on a mid-range phone: 4x slower CPU, 150 ms latency, 1.6 Mbps.
  {
    const runs = [];
    for (let i = 0; i < 3; i++) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.goto(url, { waitUntil: 'load', timeout: 120000 });
      runs.push(await page.evaluate(() => new Promise((resolve) => {
        const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0;
        new PerformanceObserver((list) => { const e = list.getEntries(); resolve({ fcp, lcp: e[e.length - 1].startTime }); }).observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => resolve({ fcp, lcp: fcp }), 3000);
      })));
      await context.close();
    }
    const median = (k) => Math.round(runs.map((r) => r[k]).sort((a, b) => a - b)[1]);
    result.speed = { fcp: median('fcp'), lcp: median('lcp') };
  }

  return result;
}

// The scorecard: each check, whether it passed, and the number behind it.
export function score(r) {
  const checks = [
    ['Hero spans the full width (desktop)', r.desktop.heroFullBleed],
    ['Hero spans the full width (phone)', r.phone.heroFullBleed],
    ['Quote band spans the full width', r.desktop.bandFullBleed],
    ['Feature row is wider than the text column', r.desktop.rowSpan > 900, `${r.desktop.rowSpan}px`],
    ['Lines stay readable (at most 90 characters)', r.desktop.maxChars > 0 && r.desktop.maxChars <= 90, `${r.desktop.maxChars} chars`],
    ['"Questions" heading lines up with the FAQ', r.desktop.headingOffset !== null && r.desktop.headingOffset <= 2, r.desktop.headingOffset === null ? 'not found' : `${r.desktop.headingOffset}px off`],
    ['One <h1> (no stray page title)', r.desktop.h1 === 1, `${r.desktop.h1}`],
    ['No sideways scrolling on a 360px phone', !r.phone.sideways],
    ['Text meets WCAG AA contrast (light)', r.desktop.contrast.length === 0, `${r.desktop.contrast.length} failing`],
    ['Follows the reader\'s dark mode', r.followsDarkMode],
    ['Text meets WCAG AA contrast (dark)', r.dark.contrast.length === 0, `${r.dark.contrast.length} failing`],
    ['FAQ opens with the keyboard', r.keyboardFaq],
    ['FAQ opens with JavaScript off', r.noJsFaq],
    ['No TagCheck errors in the HTML', r.tagcheck.errors.length === 0, `${r.tagcheck.errors.length} errors`],
    ['Largest paint under 2.5 s on a mid-range phone', r.speed.lcp <= 2500, `${(r.speed.lcp / 1000).toFixed(2)} s`],
  ];
  return { checks, passed: checks.filter(([, ok]) => ok).length, total: checks.length };
}
