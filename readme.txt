=== TagKit ===
Contributors: kovirlabs
Requires at least: 6.6
Tested up to: 7.1
Requires PHP: 7.4
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html

A plain, fast, accessible block theme: semantic HTML styled by TagBrush.css, with light and dark mode and one color that themes the whole site.

== Description ==

TagKit keeps your site simple. Your posts and pages are written as plain, semantic HTML and styled by TagBrush.css: comfortable reading width, clear headings, tables, quotes, and code, in light and dark mode that follow each reader's system setting.

Choose a Primary color in Appearance > Editor > Styles and the whole site follows: links, buttons, accents, and the soft tints behind them, always readable in both light and dark mode. Headings use Bricolage Grotesque, bundled with the theme; choose other fonts the same way.

Small touches from TagAction make code blocks copyable, tables sortable, and headings linkable. TagAction only loads on pages that use it, and everything works with JavaScript turned off.

TagKit is part of the Tag family from Kovir Labs: https://github.com/kovirlabs/tagstack

== Frequently Asked Questions ==

= How do I change the color? =

Go to Appearance > Editor > Styles > Colors and change Primary. TagBrush.css works out readable text, hover, and dark mode colors from it.

= Can I turn off TagAction? =

Yes. Add this to a plugin or a child theme: add_filter( 'tagkit_load_tagaction', '__return_false' );

== Changelog ==

= 0.1.0 =
* First version: templates for the blog, single posts, pages, archives, search, and 404; header and footer parts; TagBrush.css and TagAction bundled; WordPress block compatibility styles; wide and full-width blocks; a front page and a "Page without title" template for landing pages; Card and Featured card block styles and a Pricing pattern; Bricolage Grotesque for headings.

== Copyright ==

TagKit WordPress Theme, Copyright 2026 Kovir Labs
TagKit is distributed under the terms of the GNU GPL v3 or later.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

TagKit bundles the following third-party resources:

TagBrush.css, Copyright 2026 Kovir Labs
License: Apache License 2.0
Source: https://github.com/kovirlabs/tagbrush

TagAction, Copyright 2026 Kovir Labs
License: Apache License 2.0
Source: https://github.com/kovirlabs/tagaction

Bricolage Grotesque, Copyright 2022 The Bricolage Grotesque Project Authors
License: SIL Open Font License 1.1 (assets/fonts/bricolage-grotesque/OFL.txt)
Source: https://github.com/ateliertriay/bricolage

Screenshot: the theme showing the WordPress Theme Unit Test post "Markup: HTML Tags and Formatting" (GPLv2 or later, https://github.com/WordPress/theme-test-data).
