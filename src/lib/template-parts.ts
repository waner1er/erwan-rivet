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
const header = () => `<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|30","right":"var:preset|spacing|30","bottom":"var:preset|spacing|30","left":"var:preset|spacing|30"}},"elements":{"link":{"color":{"text":"var:preset|color|contrast"}}}},"textColor":"contrast","layout":{"type":"flex","justifyContent":"space-between"}} -->
<div class="wp-block-group alignfull has-contrast-color has-text-color has-link-color" style="padding-top:var(--wp--preset--spacing--30);padding-right:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--30);padding-left:var(--wp--preset--spacing--30)"><!-- wp:group {"style":{"layout":{"selfStretch":"fixed","flexSize":"100%"}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
<div class="wp-block-group"><!-- wp:wan/site-title {"style":{"elements":{"link":{"color":{"text":"var:preset|color|contrast"},":hover":{"color":{"text":"var:preset|color|contrast"}}}}},"textColor":"contrast","fontSize":"large"} /-->

<!-- wp:wan/social-links {"source":"header"} /-->

<!-- wp:wan/search /--></div>
<!-- /wp:group -->

<!-- wp:group {"style":{"layout":{"selfStretch":"fixed","flexSize":"100%"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"left","verticalAlignment":"center"}} -->
<div class="wp-block-group"><!-- wp:wan/menu {"fontSize":"medium","style":{"spacing":{"blockGap":"var:preset|spacing|40"},"layout":{"selfStretch":"fill"}},"layout":{"type":"flex","justifyContent":"left"}} -->
${menuLinks(getSettings().menu)}
<!-- /wp:wan/menu --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->`;

const footer = () => `<!-- wp:group {"align":"full","style":{"dimensions":{"minHeight":"40vh"},"spacing":{"margin":{"top":"0","bottom":"0"},"padding":{"top":"var:preset|spacing|60","right":"var:preset|spacing|50","bottom":"var:preset|spacing|60","left":"var:preset|spacing|50"},"blockGap":"var:preset|spacing|40"}},"textColor":"contrast","layout":{"type":"flex","orientation":"vertical","justifyContent":"center","verticalAlignment":"center"}} -->
<div class="wp-block-group alignfull has-contrast-color has-text-color" style="min-height:40vh;margin-top:0;margin-bottom:0;padding-top:var(--wp--preset--spacing--60);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--60);padding-left:var(--wp--preset--spacing--50)"><!-- wp:wan/site-logo {"align":"center","style":{"spacing":{"margin":{"bottom":"6px"}}}} /-->

<!-- wp:wan/social-links {"source":"footer","iconSize":"normal","className":"is-style-logos-only","style":{"spacing":{"blockGap":{"top":"12px","left":"12px"}}},"layout":{"type":"flex","flexWrap":"nowrap"}} /--></div>
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
