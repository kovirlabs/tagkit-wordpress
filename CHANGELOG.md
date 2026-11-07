# Changelog

## 0.1.0 (unreleased)

First version. Bundles TagBrush.css 1.2.0 and TagAction 0.1.0. Tested with WordPress 7.1.

- Block theme with templates for the posts list, single posts, pages, archives, search, and 404, and header and footer parts.
- `theme.json` maps the Site Editor's Primary color and fonts into TagBrush.css, uses TagBrush.css's reading width, and styles buttons like TagBrush.css's.
- `assets/css/wordpress.css`: TagBrush.css's page layout for `.wp-site-blocks`, post cards, and fixes where core block styles differ (tables, search, calendar in dark mode, classic captions and alignments, responsive content width).
- TagAction loads only on pages that use it (`tagkit_load_tagaction` filter).
- A demo site in Docker (`demo/`) with realistic posts.
- Table blocks show hairlines between rows (core's per-cell borders are replaced), post cards fill the row when there are few posts, and the comment form's 65,525-character counter is hidden.
- Tests against a Docker WordPress with the Theme Unit Test content; Theme Check in CI.
