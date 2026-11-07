// Builds the theme for release: dist/tagkit/ (the theme folder) and
// dist/tagkit.zip, with only the files WordPress needs. Development files
// (tests, scripts, node_modules, package.json) stay out.
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILES = ['style.css', 'theme.json', 'functions.php', 'readme.txt', 'screenshot.png', 'LICENSE', 'assets', 'templates', 'parts', 'patterns'];
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/tagkit', { recursive: true });
for (const file of FILES) cpSync(file, `dist/tagkit/${file}`, { recursive: true });
execFileSync('zip', ['-qr', 'tagkit.zip', 'tagkit', '-x', '*.DS_Store'], { cwd: 'dist' });
console.log('dist/tagkit.zip');
