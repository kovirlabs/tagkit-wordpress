// Saves every page in the local WordPress's sitemap (plus search and 404
// pages) as HTML files, so TagCheck can check them.
// Usage: node scripts/crawl.mjs [base URL] [output folder]
import { mkdirSync, writeFileSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:8888';
const out = process.argv[3] ?? 'test-results/pages';
mkdirSync(out, { recursive: true });

const text = async (url) => (await fetch(url)).text();
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const urls = new Set([`${base}/`, `${base}/?s=lorem`, `${base}/?s=zzzz-no-results`, `${base}/this-page-does-not-exist/`]);
for (const sitemap of locs(await text(`${base}/wp-sitemap.xml`))) for (const url of locs(await text(sitemap))) urls.add(url);

let n = 0;
for (const url of urls) {
  const html = await text(url);
  const name = url.replace(base, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
  writeFileSync(`${out}/${name}.html`, html);
  n++;
}
console.log(`${n} pages saved to ${out}`);
