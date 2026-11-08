// Copies TagBrush.css, TagAction, and the heading font from node_modules into
// assets/, since WordPress.org themes must bundle their CSS, JavaScript, and
// fonts (no CDN).
// Both the readable and the minified file are included, as the directory asks.
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';

const files = {
  'node_modules/tagbrush/tagbrush.css': 'assets/css/tagbrush.css',
  'node_modules/tagbrush/tagbrush.min.css': 'assets/css/tagbrush.min.css',
  'node_modules/tagaction/tagaction.js': 'assets/js/tagaction.js',
  'node_modules/tagaction/tagaction.min.js': 'assets/js/tagaction.min.js',
  // Bricolage Grotesque (OFL-1.1): weight and optical-size axes, Latin and Latin Extended
  'node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2': 'assets/fonts/bricolage-grotesque/bricolage-grotesque-latin.woff2',
  'node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-ext-opsz-normal.woff2': 'assets/fonts/bricolage-grotesque/bricolage-grotesque-latin-ext.woff2',
  'node_modules/@fontsource-variable/bricolage-grotesque/LICENSE': 'assets/fonts/bricolage-grotesque/OFL.txt',
};
mkdirSync('assets/fonts/bricolage-grotesque', { recursive: true });
for (const [from, to] of Object.entries(files)) copyFileSync(from, to);
const version = (name) => JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8')).version;
console.log(`assets/: TagBrush.css ${version('tagbrush')}, TagAction ${version('tagaction')}, Bricolage Grotesque ${version('@fontsource-variable/bricolage-grotesque')}`);
