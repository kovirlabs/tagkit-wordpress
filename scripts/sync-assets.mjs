// Copies TagBrush.css and TagAction from node_modules into assets/, since
// WordPress.org themes must bundle their CSS and JavaScript (no CDN).
// Both the readable and the minified file are included, as the directory asks.
import { copyFileSync, readFileSync } from 'node:fs';

const files = {
  'node_modules/tagbrush/tagbrush.css': 'assets/css/tagbrush.css',
  'node_modules/tagbrush/tagbrush.min.css': 'assets/css/tagbrush.min.css',
  'node_modules/tagaction/tagaction.js': 'assets/js/tagaction.js',
  'node_modules/tagaction/tagaction.min.js': 'assets/js/tagaction.min.js',
};
for (const [from, to] of Object.entries(files)) copyFileSync(from, to);
const version = (name) => JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8')).version;
console.log(`assets/: TagBrush.css ${version('tagbrush')}, TagAction ${version('tagaction')}`);
