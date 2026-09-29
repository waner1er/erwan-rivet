// Imports the scraped WordPress site (pages, posts, custom post types, taxonomies, media) into SQLite.
// Usage: node scripts/import-wp.ts [path-to-scrape] [--reset]
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { getDb, run, get, UPLOADS_DIR } from '../src/lib/db.ts';
import {
  saveCategory,
  savePage,
  savePost,
  saveTag,
  type PageInput,
  type PostTemplate,
  type PostType,
} from '../src/lib/content.ts';

const args = process.argv.slice(2);
const SCRAPE = path.resolve(args.find((a) => !a.startsWith('--')) ?? '../erwan-rivet.fr');
const RESET = args.includes('--reset');

if (!fs.existsSync(path.join(SCRAPE, 'index.html'))) {
  console.error(`Scrape not found in ${SCRAPE}`);
  process.exit(1);
}

getDb();
if (RESET) {
  for (const table of ['post_tags', 'posts', 'tags', 'categories', 'pages', 'media']) run(`DELETE FROM ${table}`);
  console.log('Existing content removed.');
}

// ---------- Helpers ----------

function load(rel: string): CheerioAPI {
  return cheerio.load(fs.readFileSync(path.join(SCRAPE, rel), 'utf8'));
}

/** URL path the scraped file was served at, used to resolve its relative links. */
function servedPath(rel: string): string {
  return '/' + rel.replace(/\\/g, '/');
}

/** Turns a scraped href/src into a clean absolute path on the new site. */
function normalizeUrl(raw: string, from: string): string {
  if (!raw || /^(mailto:|tel:|#|data:|javascript:)/i.test(raw)) return raw;
  let url = raw.replace(/^https?:\/\/(www\.)?erwan-rivet\.fr/i, '');
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('index.html#')) return url.slice('index.html'.length);
  const resolved = new URL(url, `https://site${from}`);
  let p = decodeURIComponent(resolved.pathname);
  p = p.replace(/^\/app\/uploads\//, '/uploads/');
  if (!p.startsWith('/uploads/')) {
    p = p.replace(/\/feed\/index\.html$/, '/').replace(/\/index\.html$/, '/').replace(/\.html$/, '/');
    if (p === '/tag/javascript/feed/') p = '/';
  }
  return p + resolved.hash;
}

function rewriteSrcset(srcset: string, from: string): string {
  return srcset
    .split(',')
    .map((part) => {
      const [u, w] = part.trim().split(/\s+/);
      return [normalizeUrl(u, from), w].filter(Boolean).join(' ');
    })
    .join(', ');
}

/** Cleans a content fragment: pagespeed lazy images, links, upload paths. */
function cleanFragment($: CheerioAPI, el: cheerio.Cheerio<any>, from: string): string {
  el.find('img').each((_, img) => {
    const $img = $(img);
    const lazy = $img.attr('data-pagespeed-lazy-src');
    const lazySet = $img.attr('data-pagespeed-lazy-srcset');
    if (lazy) $img.attr('src', lazy);
    if (lazySet) $img.attr('srcset', lazySet);
    for (const attr of Object.keys(img.attribs)) {
      if (attr.startsWith('data-pagespeed') || attr === 'onload' || attr === 'onerror') $img.removeAttr(attr);
    }
    const src = $img.attr('src');
    if (src) $img.attr('src', normalizeUrl(src, from));
    const srcset = $img.attr('srcset');
    if (srcset) $img.attr('srcset', rewriteSrcset(srcset, from));
    if (!$img.attr('loading') && $img.attr('fetchpriority') !== 'high') $img.attr('loading', 'lazy');
  });
  el.find('a[href]').each((_, a) => {
    const $a = $(a);
    $a.attr('href', normalizeUrl($a.attr('href')!, from));
  });
  el.find('script, noscript, style').remove();
  return (el.html() ?? '').trim();
}

function cleanOuter($: CheerioAPI, el: cheerio.Cheerio<any>, from: string): string {
  const wrapper = $('<div></div>').append(el.clone());
  return cleanFragment($, wrapper, from);
}

function meta($: CheerioAPI, name: string): string | null {
  return $(`meta[name="${name}"], meta[property="${name}"]`).attr('content')?.trim() || null;
}

function publishedAt($: CheerioAPI): string | null {
  const iso = meta($, 'og:published_time') ?? meta($, 'article:published_time');
  return iso ? iso.slice(0, 19) : null;
}

/** Prefers the full-size upload over a WordPress "-1024x469" variant when it exists. */
function fullSize(src: string | undefined, from: string): string | null {
  if (!src) return null;
  const url = normalizeUrl(src, from);
  const original = url.replace(/-\d+x\d+(\.\w+)$/, '$1');
  if (original !== url && fs.existsSync(path.join(UPLOADS_DIR, original.replace(/^\/uploads\//, '')))) return original;
  return url;
}

function coverImage($: CheerioAPI, from: string): string | null {
  const img = $('.wp-block-cover img.wp-block-cover__image-background').first();
  return fullSize(img.attr('data-pagespeed-lazy-src') ?? img.attr('src'), from);
}

// ---------- Media ----------

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

function importMedia() {
  const src = path.join(SCRAPE, 'app', 'uploads');
  let count = 0;
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(abs);
        continue;
      }
      const rel = path.relative(src, abs).split(path.sep).join('/');
      const dest = path.join(UPLOADS_DIR, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(abs, dest);
      // Only originals are listed in the media library; resized variants stay on disk for srcset.
      if (/-\d+x\d+\.\w+$/.test(e.name)) continue;
      const mime = MIME[path.extname(e.name).toLowerCase()] ?? 'application/octet-stream';
      run('INSERT OR IGNORE INTO media (path, filename, mime, size) VALUES (?, ?, ?, ?)', [`/uploads/${rel}`, e.name, mime, fs.statSync(abs).size]);
      count++;
    }
  };
  walk(src);
  console.log(`Media: ${count} files`);
}

// ---------- Pages ----------

function upsertPage(input: PageInput) {
  const existing = get<{ id: number }>('SELECT id FROM pages WHERE slug = ?', [input.slug]);
  savePage(input, existing?.id);
  console.log(`Page: /${input.slug}`);
}

function importPages() {
  // Home
  {
    const rel = 'index.html';
    const $ = load(rel);
    upsertPage({
      slug: '',
      title: 'Accueil',
      content: cleanFragment($, $('.entry-content').first(), servedPath(rel)),
      format: 'html',
      template: 'default',
      list_type: null,
      cover_image: null,
      meta_description: meta($, 'description'),
      status: 'published',
    });
  }

  // Pages with a cover banner
  for (const slug of ['mon-parcours', 'developpement-web', 'gestion-de-projet-produit-digital', 'contact']) {
    const rel = `${slug}/index.html`;
    const $ = load(rel);
    const content = $('.entry-content').first();
    content.find('.fluentform').replaceWith('<p>[contact-form]</p>');
    upsertPage({
      slug,
      title: $('h1.wp-block-post-title').first().text().trim(),
      content: cleanFragment($, content, servedPath(rel)),
      format: 'html',
      template: 'cover',
      list_type: null,
      cover_image: coverImage($, servedPath(rel)),
      meta_description: meta($, 'description'),
      status: 'published',
    });
  }

  // Blog home
  {
    const rel = 'blog/index.html';
    const $ = load(rel);
    const main = $('main').first().clone();
    main.find('h1, .wp-block-erwan-category-posts').remove();
    upsertPage({
      slug: 'blog',
      title: 'Blog',
      content: cleanFragment($, main, servedPath(rel)),
      format: 'html',
      template: 'blog',
      list_type: null,
      cover_image: null,
      meta_description: meta($, 'description'),
      status: 'published',
    });
  }

  // Custom post type archives
  const archives: { slug: string; rel: string; type: PostType; intro: string }[] = [
    { slug: 'realisations', rel: 'realisations/index.html', type: 'realisation', intro: '.wp-block-cover + .wp-block-group > .wp-block-group' },
    { slug: 'travaux-en-entreprise', rel: 'travaux-en-entreprise/index.html', type: 'travail', intro: '.wp-block-cover + .wp-block-group > .wp-block-group' },
    { slug: 'projets-personnels', rel: 'projets-personnels.html', type: 'projet', intro: '.wp-block-cover + p' },
  ];
  for (const a of archives) {
    const $ = load(a.rel);
    upsertPage({
      slug: a.slug,
      title: $('h1').first().text().trim(),
      content: cleanOuter($, $(a.intro).first(), servedPath(a.rel)),
      format: 'html',
      template: 'list',
      list_type: a.type,
      cover_image: coverImage($, servedPath(a.rel)),
      meta_description: meta($, 'description'),
      status: 'published',
    });
  }
}

// ---------- Taxonomies ----------

const categoryIds = new Map<string, number>(); // slug -> id
const postCategory = new Map<string, string>(); // post path -> category slug
const tagIds = new Map<string, number>();
const postTags = new Map<string, Set<string>>(); // post path -> tag slugs

function upsertCategory(slug: string, name: string, description: string | null, parentSlug: string | null, position: number) {
  const existing = get<{ id: number }>('SELECT id FROM categories WHERE slug = ?', [slug]);
  const id = saveCategory({ slug, name, description, parent_id: parentSlug ? categoryIds.get(parentSlug) ?? null : null, position }, existing?.id);
  categoryIds.set(slug, id);
}

function lastSegment(url: string): string {
  return url.split('/').filter(Boolean).pop() ?? '';
}

function importCategories() {
  const rel = 'blog/index.html';
  const $ = load(rel);
  $('.ca-term').each((i, term) => {
    const $term = $(term);
    const link = $term.find('.ca-term__link').first();
    const slug = lastSegment(normalizeUrl(link.attr('href')!, servedPath(rel)));
    const catRel = `${slug}/index.html`;
    const description = fs.existsSync(path.join(SCRAPE, catRel)) ? load(catRel)('.wp-block-term-description').text().trim() || null : null;
    upsertCategory(slug, link.text().trim(), description, null, i);
    $term.find('.ca-child').each((j, child) => {
      const $child = $(child);
      const childLink = $child.find('.ca-child__link').first();
      const childSlug = lastSegment(normalizeUrl(childLink.attr('href')!, servedPath(rel)));
      const childRel = `${slug}/${childSlug}/index.html`;
      const childDesc = fs.existsSync(path.join(SCRAPE, childRel)) ? load(childRel)('.wp-block-term-description').text().trim() || null : null;
      upsertCategory(childSlug, childLink.text().trim(), childDesc, slug, j);
      $child.find('.ca-post__title a').each((_, a) => {
        postCategory.set(normalizeUrl($(a).attr('href')!, servedPath(rel)), childSlug);
      });
    });
    console.log(`Category: ${slug}`);
  });
}

function addPostTag(postPath: string, tagSlug: string) {
  if (!postTags.has(postPath)) postTags.set(postPath, new Set());
  postTags.get(postPath)!.add(tagSlug);
}

function importTags() {
  const tagDir = path.join(SCRAPE, 'tag');
  for (const slug of fs.readdirSync(tagDir)) {
    const rel = `tag/${slug}/index.html`;
    if (!fs.existsSync(path.join(SCRAPE, rel))) continue;
    const $ = load(rel);
    const name = $('h1').first().text().trim() || slug;
    const existing = get<{ id: number }>('SELECT id FROM tags WHERE slug = ?', [slug]);
    tagIds.set(slug, saveTag({ slug, name }, existing?.id));
    // Tag archive pages list every post of the category (plugin bug), so membership comes from the RSS feed.
    const feed = path.join(SCRAPE, 'tag', slug, 'feed', 'index.html');
    if (!fs.existsSync(feed)) continue;
    for (const m of fs.readFileSync(feed, 'utf8').matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)) {
      addPostTag(normalizeUrl(m[1].trim(), '/'), slug);
    }
  }
  console.log(`Tags: ${tagIds.size}`);
}

// ---------- Posts ----------

interface ListingInfo {
  excerpt: string | null;
  order: number;
}

/** Reads excerpts and display order from an archive page. */
function readListing(rel: string): Map<string, ListingInfo> {
  const $ = load(rel);
  const out = new Map<string, ListingInfo>();
  $('.wp-block-post').each((i, li) => {
    const $li = $(li);
    const href = $li.find('.wp-block-post-featured-image a, .wp-block-post-title a').first().attr('href');
    if (!href) return;
    const url = normalizeUrl(href, servedPath(rel));
    const excerpt = $li.find('.wp-block-post-excerpt__excerpt').text().replace(/\s+/g, ' ').trim() || null;
    out.set(url, { excerpt, order: i });
    for (const cls of ($li.attr('class') ?? '').split(/\s+/)) {
      if (cls.startsWith('tag-')) addPostTag(url, cls.slice(4));
    }
  });
  return out;
}

function importPost(rel: string, type: PostType, listing?: ListingInfo) {
  const $ = load(rel);
  const from = servedPath(rel);
  const url = normalizeUrl(rel.replace(/index\.html$/, ''), '/');
  const slug = lastSegment(url);
  const hasCover = $('main .wp-block-cover').length > 0;
  const template: PostTemplate = hasCover ? 'cover' : 'classic';
  const cover = hasCover
    ? coverImage($, from)
    : fullSize($('.wp-block-post-featured-image img').first().attr('src'), from);

  $('.wp-block-post-terms a[rel=tag]').each((_, a) => addPostTag(url, lastSegment(normalizeUrl($(a).attr('href')!, from))));

  const tags = [...(postTags.get(url) ?? [])].map((t) => tagIds.get(t)).filter((id): id is number => !!id);
  const catSlug = postCategory.get(url);
  const existing = get<{ id: number }>('SELECT id FROM posts WHERE type = ? AND slug = ?', [type, slug]);

  savePost(
    {
      type,
      slug,
      title: $('h1.wp-block-post-title').first().text().trim(),
      excerpt: listing?.excerpt ?? null,
      content: cleanFragment($, $('.entry-content').first(), from),
      format: 'html',
      template,
      cover_image: cover,
      category_id: catSlug ? categoryIds.get(catSlug) ?? null : null,
      show_toc: $('.wp-block-wan-blocks-summary-block').length > 0 ? 1 : 0,
      meta_description: meta($, 'description'),
      status: 'published',
      published_at: publishedAt($),
      tag_ids: tags,
    },
    existing?.id,
  );
  console.log(`${type}: ${url}`);
}

function importPosts() {
  const cpts: { dir: string; type: PostType; archive: string }[] = [
    { dir: 'realisation', type: 'realisation', archive: 'realisations/index.html' },
    { dir: 'travail-en-entrepris', type: 'travail', archive: 'travaux-en-entreprise/index.html' },
    { dir: 'projets-personnels', type: 'projet', archive: 'projets-personnels.html' },
  ];
  for (const c of cpts) {
    const listing = readListing(c.archive);
    for (const slug of fs.readdirSync(path.join(SCRAPE, c.dir))) {
      const rel = `${c.dir}/${slug}/index.html`;
      if (fs.existsSync(path.join(SCRAPE, rel))) importPost(rel, c.type, listing.get(`/${c.dir}/${slug}/`));
    }
  }

  // Blog posts live at the root: any top-level folder that has a category assignment.
  for (const postPath of postCategory.keys()) {
    const rel = `${postPath.replace(/^\/|\/$/g, '')}/index.html`;
    if (fs.existsSync(path.join(SCRAPE, rel))) importPost(rel, 'post');
  }
}

importMedia();
importPages();
importCategories();
importTags();
importPosts();
console.log('Import done.');
