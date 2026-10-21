// Template parts (header, footer): site-wide areas written in Gutenberg blocks, like WordPress FSE
// `wp_template_part`. Until edited in Admin → Éditeur de site, a part uses its default markup below.
import { get, run } from './db.ts';
import { getSettings, type MenuItem } from './settings.ts';

export type TemplatePartSlug = 'header' | 'footer';

export interface TemplatePartDefinition {
  title: string;
  description: string;
  /** Element wrapping the part on the site. */
  tag: 'header' | 'footer';
  defaultContent: () => string;
}

export interface TemplatePart {
  slug: TemplatePartSlug;
  content: string;
  /** null while the part still uses its default markup. */
  updated_at: string | null;
}

/** Block comment attributes, escaped the way Gutenberg's serializer does. */
function blockAttrs(attrs: Record<string, unknown>): string {
  return JSON.stringify(attrs)
    .replace(/--/g, '\\u002d\\u002d')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\\"/g, '\\u0022');
}

const menuLinks = (items: MenuItem[]) =>
  items.map((item) => `<!-- wp:navigation-link ${blockAttrs({ label: item.label, url: item.url, kind: 'custom' })} /-->`).join('\n\n');

// The original menu (settings.menu, formerly edited in Réglages) seeds the header's Menu block.
const header = () => `<!-- wp:group {"className":"wan-site-header","layout":{"type":"flex","justifyContent":"space-between"}} -->
<div class="wp-block-group wan-site-header"><!-- wp:wan/site-title /-->

<!-- wp:wan/menu {"overlayMenu":"mobile","overlayBackgroundColor":"base","overlayTextColor":"contrast","ariaLabel":"Menu principal","layout":{"type":"flex","justifyContent":"left"}} -->
${menuLinks(getSettings().menu)}
<!-- /wp:wan/menu --></div>
<!-- /wp:group -->`;

const footer = () => `<!-- wp:group {"className":"wan-site-footer","layout":{"type":"flex","justifyContent":"space-between"}} -->
<div class="wp-block-group wan-site-footer"><!-- wp:group {"className":"wan-footer-brand","layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group wan-footer-brand"><!-- wp:wan/site-logo {"width":56,"isLink":false} /-->

<!-- wp:wan/site-title /--></div>
<!-- /wp:group -->

<!-- wp:group {"className":"wan-footer-links","layout":{"type":"flex"}} -->
<div class="wp-block-group wan-footer-links"><!-- wp:wan/social-links {"source":"footer","className":"wan-social-text"} /-->

<!-- wp:paragraph -->
<p><a href="/politique-de-confidentialite/">Politique de confidentialité</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->`;

export const TEMPLATE_PARTS: Record<TemplatePartSlug, TemplatePartDefinition> = {
  header: { title: 'En-tête', description: 'Affiché en haut de toutes les pages.', tag: 'header', defaultContent: header },
  footer: { title: 'Pied de page', description: 'Affiché en bas de toutes les pages.', tag: 'footer', defaultContent: footer },
};

export function isTemplatePartSlug(value: unknown): value is TemplatePartSlug {
  return typeof value === 'string' && value in TEMPLATE_PARTS;
}

export function getTemplatePart(slug: TemplatePartSlug): TemplatePart {
  const row = get<{ content: string; updated_at: string }>('SELECT content, updated_at FROM template_parts WHERE slug = ?', [slug]);
  return row ? { slug, ...row } : { slug, content: TEMPLATE_PARTS[slug].defaultContent(), updated_at: null };
}

export function saveTemplatePart(slug: TemplatePartSlug, content: string) {
  run(
    `INSERT INTO template_parts (slug, content) VALUES (?, ?)
     ON CONFLICT(slug) DO UPDATE SET content = excluded.content, updated_at = datetime('now')`,
    [slug, content],
  );
}

/** Back to the default markup. */
export function resetTemplatePart(slug: TemplatePartSlug) {
  run('DELETE FROM template_parts WHERE slug = ?', [slug]);
}
