// One-shot import: replaces the existing pages/posts' `content` with the
// real Gutenberg block markup (<!-- wp:... --> comments) fetched straight
// from the live WordPress REST API (context=edit, so content.raw is the
// actual post_content — not the scraped, comment-stripped HTML used by
// scripts/import-wp.ts). Also imports 3 new WP contents absent from the
// project (politique-de-confidentialite, wordpress draft, SEO 2026 draft).
//
// Usage: WP_USER=<user> WP_APP_PASSWORD="xxxx xxxx xxxx xxxx xxxx xxxx" node scripts/import-gutenberg-content.ts
import {
  getPageBySlug,
  getPostBySlug,
  getPostTags,
  getCategoryBySlug,
  getTagBySlug,
  saveCategory,
  saveTag,
  savePage,
  savePost,
  slugify,
  type PostType,
} from '../src/lib/content.ts';

const WP_BASE = 'https://erwan-rivet.fr';
const WP_USER = process.env.WP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

if (!WP_USER || !WP_APP_PASSWORD) {
  console.error('Usage: WP_USER=<user> WP_APP_PASSWORD="xxxx xxxx xxxx xxxx xxxx xxxx" node scripts/import-gutenberg-content.ts');
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString('base64');

async function wpFetch(path: string): Promise<any> {
  const res = await fetch(`${WP_BASE}/wp-json/wp/v2/${path}`, { headers: { Authorization: authHeader } });
  if (!res.ok) throw new Error(`WP API ${path} -> HTTP ${res.status}`);
  return res.json();
}

// ---------- content cleanup ----------

function cleanContent(raw: string): string {
  return raw
    // Project has no Fluent Forms plugin; the contact page already renders
    // its own form via the [contact-form] shortcode (see Content.astro).
    .replace(/<!-- wp:fluentfom\/guten-block[^>]*\/-->/g, '<!-- wp:paragraph -->\n<p>[contact-form]</p>\n<!-- /wp:paragraph -->')
    // Absolute site URLs -> root-relative, and the WP uploads path prefix.
    .replace(/https?:\/\/(?:www\.)?erwan-rivet\.fr\/app\/uploads\//g, '/uploads/')
    .replace(/https?:\/\/(?:www\.)?erwan-rivet\.fr/g, '');
}

// ---------- taxonomies ----------

const categoryIdMap = new Map<number, number>(); // wp category id -> project category id
const tagIdMap = new Map<number, number>(); // wp tag id -> project tag id

async function resolveCategories() {
  const wpCategories = await wpFetch('categories?per_page=100');
  for (const c of wpCategories) {
    if (c.slug === 'non-classe') continue; // WordPress' default "Uncategorized", not a real topic.
    const existing = getCategoryBySlug(c.slug);
    const id = existing
      ? existing.id
      : saveCategory({ slug: c.slug, name: c.name, description: c.description || null, parent_id: null, position: 0 });
    categoryIdMap.set(c.id, id);
  }
}

async function resolveTags() {
  const wpTags = await wpFetch('tags?per_page=100');
  for (const t of wpTags) {
    const existing = getTagBySlug(t.slug);
    const id = existing ? existing.id : saveTag({ slug: t.slug, name: t.name });
    tagIdMap.set(t.id, id);
  }
}

// ---------- pages ----------

const PAGE_TYPE_REST_BASE = 'pages';

async function importPages() {
  const wpPages = await wpFetch(`${PAGE_TYPE_REST_BASE}?per_page=100&context=edit&status=publish,draft`);

  for (const wp of wpPages) {
    const isHome = wp.template === '' && wp.slug === 'erwan-rivet-developpeur-web';
    // The live site's actual homepage is served at slug "", matching the
    // project's existing home page row.
    const projectSlug = isHome ? '' : wp.slug;
    const content = cleanContent(wp.content.raw);
    const existing = getPageBySlug(projectSlug, true);

    if (existing) {
      const { id: existingId, created_at, updated_at, ...rest } = existing;
      savePage({ ...rest, content }, existingId);
      console.log(`Page #${existingId} (${projectSlug || '/'}) — contenu remplacé par la version Gutenberg.`);
    } else {
      const id = savePage({
        slug: projectSlug,
        title: wp.title.raw,
        content,
        format: 'html',
        template: 'default',
        list_type: null,
        cover_image: null,
        meta_description: null,
        status: wp.status === 'publish' ? 'published' : 'draft',
      });
      console.log(`Page #${id} (${projectSlug}) — nouvelle page importée.`);
    }
  }
}

// ---------- posts (standard + custom post types) ----------

const POST_TYPE_REST_BASE: Record<PostType, string> = {
  post: 'posts',
  realisation: 'realisation',
  travail: 'travail-en-entrepris',
  projet: 'projets-personnels',
};

async function importPostsOfType(type: PostType) {
  const base = POST_TYPE_REST_BASE[type];
  const wpPosts = await wpFetch(`${base}?per_page=100&context=edit&status=publish,draft`);

  for (const wp of wpPosts) {
    const slug = wp.slug || slugify(wp.title.raw) || `brouillon-${wp.id}`;
    const content = cleanContent(wp.content.raw);
    const existing = getPostBySlug(type, slug, true);

    const tagIds: number[] = (wp.tags ?? []).map((wpTagId: number) => tagIdMap.get(wpTagId)).filter(Boolean);
    const categoryId = (wp.categories ?? [])
      .map((wpCatId: number) => categoryIdMap.get(wpCatId))
      .find((id: number | undefined) => id !== undefined) ?? null;

    if (existing) {
      const existingTagIds = getPostTags(existing.id).map((t) => t.id);
      const { id: existingId, created_at, updated_at, ...rest } = existing;
      savePost({ ...rest, content, tag_ids: existingTagIds }, existingId);
      console.log(`Post #${existingId} (${type}/${slug}) — contenu remplacé par la version Gutenberg.`);
    } else {
      const id = savePost({
        type,
        slug,
        title: wp.title.raw,
        excerpt: null,
        content,
        format: 'html',
        template: 'cover',
        cover_image: null,
        category_id: type === 'post' ? categoryId : null,
        show_toc: 0,
        meta_description: null,
        status: wp.status === 'publish' ? 'published' : 'draft',
        published_at: wp.status === 'publish' ? wp.date : null,
        tag_ids: type === 'post' ? tagIds : [],
      });
      console.log(`Post #${id} (${type}/${slug}) — nouveau contenu importé.`);
    }
  }
}

async function main() {
  await resolveCategories();
  await resolveTags();
  await importPages();
  for (const type of ['post', 'realisation', 'travail', 'projet'] as const) {
    await importPostsOfType(type);
  }
  console.log('\nImport terminé.');
}

main();
