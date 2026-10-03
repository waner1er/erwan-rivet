## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Theming

The visual theme is decoupled from content and templates by design, so it can be swapped later without touching either:

- **Palette, fonts, sizes, spacing**: declared once in `src/theme/theme.json` (semantic preset names, not raw hex/px scattered around). Regenerate the compiled stylesheet with `npm run theme:build`, which writes `public/css/theme-vars.css` from that file. This stylesheet defines the `--wp--preset--*` CSS custom properties and base typography (`body`, `h1`-`h6`); nothing else should hardcode a color/font/spacing value — reference the preset variables instead.
- **Layout primitives**: `public/css/wan-layout.css` holds hand-written, reusable utility classes (`wan-stack-*`, `wan-row-*`, `wan-bleed-*`, `wan-grid-*`) for the flex/grid/spacing patterns every template needs. These replaced WordPress' auto-generated `wp-container-core-*-is-layout-<hash>` classes — each one a one-off snapshot tied to the exact instance that generated it, meaningless outside it. **Never reintroduce a `wp-container-core-*-is-layout-<hash>` class** in a template or in content saved from the editor; use or extend the `wan-*` utilities instead.
- **Generic WordPress block CSS**: `public/css/wp.css` holds the remaining block-layout rules extracted from the original WordPress theme via `scripts/extract-css.mjs` (rarely re-run — only if re-importing from a live WordPress site). Mostly theme-agnostic plumbing (`.is-layout-flow`, `.has-global-padding`, block-specific selectors like `.wp-block-button`), loaded after `theme-vars.css` so it can keep referencing the same preset variable names.
- **Load order** (see `BaseLayout.astro` and `GutenbergEditor.tsx`, which must stay in sync): `theme-vars.css` → `wp.css` → `wan-layout.css` → `site.css` (project-specific additions).

All of this is compile-time only — `theme-vars.css`/`wan-layout.css` are plain static files served via `<link rel="stylesheet">`, never fetched or computed at runtime on the public site (that would cost PageSpeed score). The admin-only Gutenberg editor does `fetch()` these same stylesheets client-side to preview content with the live theme, but that code never ships to the public bundle (`/admin/*` is excluded from the static export — see `astro.config.mjs`).

To swap the theme: edit `theme.json` and/or replace `wp.css`/`wan-layout.css`, regenerate with `npm run theme:build`, and verify visually — content and templates don't need to change.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
