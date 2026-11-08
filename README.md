# TagKit for WordPress

Use this when you want a WordPress site that is plain, fast, and accessible: semantic HTML styled by TagBrush.css, light and dark mode that follow each reader's system, and one color that themes the whole site.

TagKit is a block theme (full site editing). It's part of the [Tag family](https://github.com/kovirlabs/tagstack): [TagBrush.css](https://github.com/kovirlabs/tagbrush) styles the page, [TagAction](https://github.com/kovirlabs/tagaction) adds small touches (copy buttons on code, sortable tables, heading links) on pages that use them, and [TagCheck](https://github.com/kovirlabs/tagcheck) checks the result.

## Install

Download `tagkit.zip` from the latest [CI run](https://github.com/kovirlabs/tagkit-wordpress/actions) (or build it with `npm run zip`), then in WordPress go to Appearance > Themes > Add New > Upload Theme.

## What you get

- Templates for the posts list (cards in a grid), single posts (author, date, categories, tags, previous/next, comments), pages, archives, search, and 404, plus a header and footer you can edit in the Site Editor.
- Landing pages from core blocks: wide and full-width blocks (covers, colored bands, columns, galleries) break out of the text column, a static front page shows without its title, and the **Page without title** template does the same for any page.
- Landing pages have room between sections, and **Card** and **Featured card** block styles (in the Styles panel of a Column or Group) box a plan or feature; the **Pricing** pattern puts three plans in cards.
- Headings use Bricolage Grotesque, bundled with the theme (no font CDN).
- Appearance > Editor > Styles > Colors > **Primary** themes the whole site: links, buttons, accents, and tints, readable in light and dark mode. Fonts work the same way.
- Content from the classic editor (captions, alignments) and from every core block is styled, and no page scrolls sideways on a phone.
- TagAction only loads on pages with code, tables, details, forms, or comments. Turn it off with `add_filter( 'tagkit_load_tagaction', '__return_false' );`.
- Everything works with JavaScript turned off.

## How it works

TagBrush.css styles plain HTML from its own cascade layer. WordPress wraps the page in `<div class="wp-site-blocks">` and adds unlayered block styles that win over any layer, so [`assets/css/wordpress.css`](assets/css/wordpress.css) restates TagBrush.css's layout and look for WordPress's wrappers and blocks. TagBrush.css itself is bundled unchanged (WordPress.org themes can't load files from a CDN).

`theme.json` maps the Site Editor's Primary color into `--color-primary`, sets the content width to TagBrush.css's reading width, and styles WordPress's buttons with TagBrush.css's button colors.

## See it

A demo site with a landing page and realistic posts runs in Docker (it appears in Docker Desktop as `tagkit-demo`):

```sh
docker compose -f demo/docker-compose.yml up -d && sh demo/setup.sh
```

Open http://localhost:8890 (admin at http://localhost:8890/wp-admin, admin / admin). It uses the theme from this folder, so CSS changes show on reload. Stop it with `docker compose -f demo/docker-compose.yml down` (add `-v` to delete its content).

## Development

```sh
npm install
npm run assets                                        # copy TagBrush.css, TagAction, and the heading font from node_modules into assets/
docker compose -f tests/wp/docker-compose.yml up -d    # WordPress at http://localhost:8888 (admin / admin)
sh tests/wp/setup.sh                                  # install, activate, import the Theme Unit Test content
npm test                                              # Playwright + TagCheck against that WordPress
sh tests/wp/theme-check.sh                            # WordPress's Theme Check
npm run zip                                           # dist/tagkit.zip, only the files WordPress needs
```

`npm run compete` puts the same landing page in TagKit, Twenty Twenty-Five (WordPress's default theme), and Hello Elementor with Elementor (built with Elementor's own widgets), runs the landing-page checks in [`tests/landing-checks.mjs`](tests/landing-checks.mjs) on each (layout, phone width, contrast in light and dark mode, keyboard and no-JavaScript FAQ, TagCheck, page weight, and speed on a throttled phone), and writes a scorecard with screenshots to `compete-results/`. It switches the active theme while it runs, so don't run it alongside `npm test`.

To test the release build instead of the working copy: `npm run zip`, then start WordPress with `THEME_DIR=../../dist/tagkit docker compose -f tests/wp/docker-compose.yml up -d`.

The tests crawl every page of the Theme Unit Test content and check that none scrolls sideways at a 360px phone width, that text the theme colors meets WCAG AA contrast in light and dark mode, that the theme's own pages have no TagCheck errors, that a core-blocks landing page passes every landing-page check, that TagAction loads only where it's used, and that the Primary color drives TagBrush.css. CI runs them, and Theme Check, against the release zip.

## License

GPL-3.0-or-later. TagBrush.css and TagAction are bundled under the Apache License 2.0, which is compatible with GPLv3. Bricolage Grotesque is bundled under the SIL Open Font License 1.1.
