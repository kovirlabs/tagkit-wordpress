# Changelog

## 0.1.0 (unreleased)

First version. Bundles TagBrush.css 1.2.0 and TagAction 0.1.0. Tested with WordPress 7.1.

- A site at https://kovirlabs.github.io/tagkit-wordpress/ (in `docs/`, not part of the theme), in the Tag family brand.

- Block theme with templates for the posts list, single posts, pages, archives, search, and 404, and header and footer parts.
- `theme.json` maps the Site Editor's Primary color and fonts into TagBrush.css, uses TagBrush.css's reading width, and styles buttons like TagBrush.css's.
- `assets/css/wordpress.css`: TagBrush.css's page layout for `.wp-site-blocks`, post cards, and fixes where core block styles differ (tables, search, calendar in dark mode, classic captions and alignments, responsive content width).
- TagAction loads only on pages that use it (`tagkit_load_tagaction` filter).
- A demo site in Docker (`demo/`) with realistic posts.
- Theme tags list only features the theme has (no `block-styles` or `style-variations`), as the theme directory's review requires.
- Table blocks show hairlines between rows (core's per-cell borders are replaced), post cards fill the row when there are few posts, and the comment form's 65,525-character counter is hidden.
- Tests against a Docker WordPress with the Theme Unit Test content; Theme Check in CI.
- Landing pages work: wide and full-width blocks break out of the text column on pages and posts (full-width blocks reach both edges of the window), a front-page template shows a static front page without its title (the posts list is used when the front page shows the latest posts), and a "Page without title" template is available for other landing pages.
- The text column is 44rem instead of 70ch, so headings and paragraphs share one width (`ch` grows with the font size, so headings got a wider column).
- Quotes inside a block with its own colors take those colors (white text on a colored band was drawn on a light box), and a pullquote's quote is plain text instead of a boxed blockquote.
- A landing-page test (`tests/landing.spec.mjs`) and a competition script (`npm run compete`) that runs the same checks on TagKit, Twenty Twenty-Five, and Hello Elementor with Elementor.
