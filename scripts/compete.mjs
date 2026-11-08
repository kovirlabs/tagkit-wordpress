// Landing-page competition: the same landing page in TagKit, WordPress's
// default theme (Twenty Twenty-Five), and Hello Elementor with Elementor.
//
//   docker compose -f tests/wp/docker-compose.yml up -d && sh tests/wp/setup.sh
//   npm run compete
//
// TagKit and Twenty Twenty-Five get tests/wp/landing.html (core blocks). Hello
// Elementor gets tests/wp/landing-elementor.json, the same page built with
// Elementor's free widgets on its Full Width template, the way Elementor users
// build landing pages. Each page is the front page while it's measured with
// tests/landing-checks.mjs. Results go to compete-results/: report.md,
// results.json, and screenshots. Afterwards TagKit is active again, Elementor is
// off, and the front page shows the latest posts.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { measureLanding, score } from '../tests/landing-checks.mjs';

const BASE = process.env.WP_URL ?? 'http://localhost:8888';
const OUT = 'compete-results'; // not test-results/, which Playwright empties on every run
const compose = ['compose', '-f', 'tests/wp/docker-compose.yml', 'exec', '-T'];
const wp = (args, input) => execFileSync('docker', [...compose, 'cli', 'wp', ...args], { encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
const quiet = (args) => { try { return wp(args); } catch { return ''; } };

const contestants = [
  { name: 'TagKit', slug: 'tagkit', theme: 'tagkit', page: 'landing', elementor: false },
  { name: 'Twenty Twenty-Five (WordPress default)', slug: 'twentytwentyfive', theme: 'twentytwentyfive', page: 'landing', elementor: false },
  { name: 'Hello Elementor + Elementor', slug: 'hello-elementor', theme: 'hello-elementor', page: 'landing-elementor', elementor: true },
];

// Install the competitors and the Elementor page (once).
if (!wp(['theme', 'list', '--field=name']).split('\n').includes('hello-elementor')) wp(['theme', 'install', 'hello-elementor', '--quiet']);
if (!wp(['plugin', 'list', '--field=name']).split('\n').includes('elementor')) wp(['plugin', 'install', 'elementor', '--quiet']);
const pageId = (name) => wp(['post', 'list', '--post_type=page', `--name=${name}`, '--field=ID']);
if (!pageId('landing')) throw new Error('No "landing" page: run sh tests/wp/setup.sh first.');
if (!pageId('landing-elementor')) {
  const id = wp(['post', 'create', '--post_type=page', '--post_title=Landing (Elementor)', '--post_name=landing-elementor', '--post_status=publish', '--porcelain']);
  // The JSON has no backslashes, so WordPress's unslashing of meta leaves it intact.
  wp(['post', 'meta', 'update', id, '_elementor_data'], readFileSync('tests/wp/landing-elementor.json', 'utf8'));
  for (const [key, value] of [['_elementor_edit_mode', 'builder'], ['_elementor_template_type', 'wp-page'], ['_wp_page_template', 'elementor_header_footer']]) wp(['post', 'meta', 'update', id, key, value]);
}
const versions = Object.fromEntries(wp(['theme', 'list', '--fields=name,version', '--format=csv']).split('\n').slice(1).map((l) => l.split(',')));
const elementorVersion = wp(['plugin', 'get', 'elementor', '--field=version']);
const wpVersion = wp(['core', 'version']);

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const c of contestants) {
    wp(['theme', 'activate', c.theme]);
    wp(['plugin', c.elementor ? 'activate' : 'deactivate', 'elementor']);
    if (c.elementor) quiet(['elementor', 'flush-css']);
    wp(['option', 'update', 'page_on_front', pageId(c.page)]);
    wp(['option', 'update', 'show_on_front', 'page']);
    await fetch(`${BASE}/`); // let Elementor write its CSS before measuring
    process.stdout.write(`${c.name}… `);
    const r = await measureLanding(browser, `${BASE}/`, { screenshots: `${OUT}/${c.slug}` });
    results.push({ ...c, version: c.elementor ? `${versions[c.theme]} + Elementor ${elementorVersion}` : versions[c.theme], ...r, score: score(r) });
    console.log(`${results.at(-1).score.passed}/${results.at(-1).score.total}`);
  }
} finally {
  await browser.close();
  wp(['plugin', 'deactivate', 'elementor']);
  wp(['theme', 'activate', 'tagkit']);
  wp(['option', 'update', 'show_on_front', 'posts']);
}

// The report.
const mark = (ok) => (ok ? '✅' : '❌');
const rows = results[0].score.checks.map(([name], i) => `| ${name} | ${results.map((r) => { const [, ok, detail] = r.score.checks[i]; return `${mark(ok)}${detail ? ` ${detail}` : ''}`; }).join(' | ')} |`);
const kb = (r, k) => `${r.weight[k]} KB`;
const md = `# Landing-page competition

The same landing page (hero, features, image and text, quote band, pricing, FAQ, recent posts, gallery) in three themes. WordPress ${wpVersion}, Chromium. TagKit and Twenty Twenty-Five render it from core blocks (\`tests/wp/landing.html\`); Hello Elementor renders it from Elementor's free widgets on the Full Width template (\`tests/wp/landing-elementor.json\`).

| | ${results.map((r) => `**${r.name}** ${r.version}`).join(' | ')} |
|---|${results.map(() => '---').join('|')}|
| **Score** | ${results.map((r) => `**${r.score.passed} / ${r.score.total}**`).join(' | ')} |
${rows.join('\n')}

## Weight and speed

| | ${results.map((r) => r.name).join(' | ')} |
|---|${results.map(() => '---').join('|')}|
| Requests | ${results.map((r) => r.weight.requests).join(' | ')} |
| HTML | ${results.map((r) => kb(r, 'html')).join(' | ')} |
| CSS | ${results.map((r) => kb(r, 'css')).join(' | ')} |
| JavaScript | ${results.map((r) => kb(r, 'js')).join(' | ')} |
| Fonts | ${results.map((r) => kb(r, 'font')).join(' | ')} |
| Images | ${results.map((r) => kb(r, 'image')).join(' | ')} |
| DOM elements | ${results.map((r) => r.desktop.domNodes).join(' | ')} |
| Deepest nesting | ${results.map((r) => r.desktop.domDepth).join(' | ')} |
| First paint, mid-range phone | ${results.map((r) => `${(r.speed.fcp / 1000).toFixed(2)} s`).join(' | ')} |
| Largest paint, mid-range phone | ${results.map((r) => `${(r.speed.lcp / 1000).toFixed(2)} s`).join(' | ')} |

Sizes are uncompressed. Speed is the median of three loads with a 4x slower CPU, 150 ms latency, and 1.6 Mbps, on the machine that ran this, so compare the themes with each other rather than with field data.

## Details

${results.map((r) => `### ${r.name}

- Contrast failures (light): ${r.desktop.contrast.join('; ') || 'none'}
- Contrast failures (dark): ${r.dark.contrast.join('; ') || 'none'}
- TagCheck errors: ${r.tagcheck.errors.join('; ') || 'none'} (${r.tagcheck.warnings} warnings)
- Screenshots: ${['desktop', 'dark', 'phone'].map((v) => `[${v}](${r.slug}-${v}.png)`).join(', ')}
`).join('\n')}`;
writeFileSync(`${OUT}/report.md`, md);
writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 1));
console.log(`\n${OUT}/report.md`);
