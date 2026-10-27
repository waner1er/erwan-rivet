---
version: 1
slug: "src-views-pageview-astro"
primary_target: "src/views/PageView.astro"
related_targets: ["public/css/site.css","src/theme/theme.json"]
---

## Scope

Whole public site (home first), visitor mode: Persuade. Audience: TPE/association/agency clients and recruiters, equally. Action: contact ("Parlons de votre site"). Proof: real client work (Momentum Conseil first), real portrait. Constraints: static Astro export, theme in theme.json/site.css, Gutenberg content must keep rendering, light + dark automatic.

## Direction contract

THESIS: A quiet, near-monochrome portfolio in the manner of a minimal handheld-console theme: the work and the man carry all the colour, the interface stays black, white and grey. Refuses the category default of a cream page with coloured accent, eyebrow labels and a grid of equal cards.

OWN-WORLD: Near-black #141414 ground (light variant #ececea), white ink, inactive items dimmed, console grey #bdbdbd for the contact band, no accent hue. Nunito 800 headings, Nunito 500 body. Open items separated by hairlines, never boxed; pill buttons in ink; project images held in greyscale, full colour on hover.

STORY: The visitor meets Erwan (name, "Développeur web", portrait in colour), understands the maintenance offer as three clear rows, sees real projects in colour one at a time, and contacts him.

FIRST VIEWPORT: Name in very large Nunito 800 at left with "Développeur web" under it, lead paragraph and two buttons (primary ink pill "Parlons de votre site"); at right, a small portrait in colour with the Momentum Conseil screenshot offset over its lower corner, in greyscale until hovered. A tech band (outlined/filled alternating words) under the fold line.

FORM: User-pinned direction (Figma "minimal theme for retroconsoles", aesthetic only); it overrides the roll. Signature interaction: on the work list, hovering one project lifts its colour and dims the others, as an inactive menu item is dimmed. seed:db87c5d7a64005a5

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
