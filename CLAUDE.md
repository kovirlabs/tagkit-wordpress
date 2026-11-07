# CLAUDE.md

Guidance for Claude Code working in kovirlabs/tagkit-wordpress, the WordPress block theme in TagKit (Tag Family Ecosystem Spec, section 7.3).

## Rules

- WordPress.org theme directory requirements apply from the start: GPL-3.0-or-later, all CSS and JS bundled (no CDN), text translatable with the `tagkit` text domain (put text in `patterns/*.php`, not in templates), escaped output, readme.txt and screenshot.png kept current, nothing that's plugin territory.
- Don't change TagBrush.css to fit WordPress. Bundle it unchanged (`npm run assets`) and put WordPress-specific rules in `assets/css/wordpress.css`, wrapped in `:where()` unless they must beat a core block style.
- Semantic templates: header, main, article, footer; heading levels in order.
- No page of the Theme Unit Test content may scroll sideways on a phone, and text the theme colors must meet WCAG AA in light and dark mode (tested).
- Release zips contain only the files listed in `scripts/zip.mjs`.

## Workflow

- `docker compose -f tests/wp/docker-compose.yml up -d && sh tests/wp/setup.sh`, then `npm test` and `sh tests/wp/theme-check.sh` before every commit.
- Bump `Version` in style.css, readme.txt's changelog, and CHANGELOG.md together.
