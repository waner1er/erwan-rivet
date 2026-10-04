import { marked } from 'marked';
import { all, get, run, transaction } from './db.ts';
import { sanitizeContentHtml } from './sanitize.ts';
import { renderBlocks } from './blocks/render.ts';
import { getSettings } from './settings.ts';

export type Status = 'published' | 'draft';
export type Format = 'html' | 'markdown';
export type PostType = 'post' | 'realisation' | 'travail' | 'projet';
export type PostTemplate = 'cover' | 'classic';
export type PageTemplate = 'default' | 'cover' | 'raw' | 'blog' | 'list';

export interface Page {
  id: number;
  slug: string;
  title: string;
  content: string;
  format: Format;
  template: PageTemplate;
  list_type: PostType | null;
  cover_image: string | null;
  meta_description: string | null;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  type: PostType;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  format: Format;
  template: PostTemplate;
  cover_image: string | null;
  category_id: number | null;
  show_toc: number;
  meta_description: string | null;
  status: Status;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  parent_id: number | null;
  position: number;
}

export interface Tag {
  id: number;
  slug: string;
  name: string;
}

export const POST_TYPES: Record<PostType, { label: string; plural: string; base: string }> = {
  post: { label: 'Article', plural: 'Articles du blog', base: '' },
  realisation: { label: 'Réalisation', plural: 'Réalisations', base: 'realisation' },
  travail: { label: 'Travail en entreprise', plural: 'Travaux en entreprise', base: 'travail-en-entrepris' },
  projet: { label: 'Projet personnel', plural: 'Projets personnels', base: 'projets-personnels' },
};

export function isPostType(value: unknown): value is PostType {
  return typeof value === 'string' && value in POST_TYPES;
}

// ---------- URLs ----------

export function postUrl(post: Pick<Post, 'type' | 'slug'>): string {
  const base = POST_TYPES[post.type].base;
  return base ? `/${base}/${post.slug}/` : `/${post.slug}/`;
}

export function pageUrl(page: Pick<Page, 'slug'>): string {
  return page.slug ? `/${page.slug}/` : '/';
}

export function categoryUrl(cat: Category): string {
  const parent = cat.parent_id ? getCategory(cat.parent_id) : undefined;
  return parent ? `/${parent.slug}/${cat.slug}/` : `/${cat.slug}/`;
}

export function tagUrl(tag: Tag): string {
  return `/tag/${tag.slug}/`;
}

// ---------- Utils ----------

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&rsquo;|&#8217;/g, '’')
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateWords(text: string, words: number): string {
  const parts = text.split(' ');
  return parts.length <= words ? text : parts.slice(0, words).join(' ') + '…';
}

export function excerptOf(post: Post, words = 25): string {
  if (post.excerpt) return post.excerpt;
  return truncateWords(stripHtml(renderBody(post.content, post.format)), words);
}

export function wordCount(html: string): number {
  const text = stripHtml(html).trim();
  return text ? text.split(/\s+/).length : 0;
}

/** Rough reading time at 200 words/minute, rounded up, minimum 1. */
export function readingTimeMinutes(html: string): number {
  return Math.max(1, Math.ceil(wordCount(html) / 200));
}

/** First <img src> found in rendered HTML, used as an image fallback when no cover is set. */
export function firstImage(html: string): string | null {
  return /<img[^>]+src=["']([^"']+)["']/i.exec(html)?.[1] ?? null;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ---------- Rendering ----------

export interface TocItem {
  id: string;
  text: string;
  children: TocItem[];
}

export function renderBody(content: string, format: Format): string {
  if (format === 'markdown') return sanitizeContentHtml(marked.parse(content, { async: false }) as string);
  // Gutenberg markup goes through the block renderer for its render-time supports (layout, gap...).
  if (content.includes('<!-- wp:')) {
    let n = 0;
    return renderBlocks(content, { settings: getSettings(), currentPath: '', uid: () => ++n });
  }
  return sanitizeContentHtml(content);
}

/** Renders content, adds ids on h2/h3 that lack one and builds a table of contents. */
export function renderWithToc(content: string, format: Format): { html: string; toc: TocItem[] } {
  const html = renderBody(content, format);
  const toc: TocItem[] = [];
  const used = new Set<string>();
  const out = html.replace(/<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (match, level: string, attrs = '', inner: string) => {
    const text = stripHtml(inner);
    if (!text) return match;
    let id = /\sid=["']?([^"'\s>]+)/.exec(attrs)?.[1];
    if (!id) {
      id = slugify(text) || 'section';
      let n = 2;
      while (used.has(id)) id = `${slugify(text)}-${n++}`;
      attrs = `${attrs} id="${id}"`;
    }
    used.add(id);
    const item = { id, text, children: [] };
    if (level === '2' || toc.length === 0) toc.push(item);
    else toc[toc.length - 1].children.push(item);
    return `<h${level}${attrs}>${inner}</h${level}>`;
  });
  return { html: out, toc };
}

// ---------- Pages ----------

export function listPages(): Page[] {
  return all<Page>('SELECT * FROM pages ORDER BY slug');
}

export function getPageBySlug(slug: string, includeDrafts = false): Page | undefined {
  return get<Page>(
    `SELECT * FROM pages WHERE slug = ? ${includeDrafts ? '' : "AND status = 'published'"}`,
    [slug],
  );
}

export function getPage(id: number): Page | undefined {
  return get<Page>('SELECT * FROM pages WHERE id = ?', [id]);
}

export type PageInput = Omit<Page, 'id' | 'created_at' | 'updated_at'>;

export function savePage(input: PageInput, id?: number): number {
  const params = { ...input };
  if (id) {
    run(
      `UPDATE pages SET slug=:slug, title=:title, content=:content, format=:format, template=:template,
       list_type=:list_type, cover_image=:cover_image, meta_description=:meta_description, status=:status,
       updated_at=datetime('now') WHERE id=:id`,
      { ...params, id },
    );
    return id;
  }
  const res = run(
    `INSERT INTO pages (slug, title, content, format, template, list_type, cover_image, meta_description, status)
     VALUES (:slug, :title, :content, :format, :template, :list_type, :cover_image, :meta_description, :status)`,
    params,
  );
  return Number(res.lastInsertRowid);
}

export function deletePage(id: number) {
  run('DELETE FROM pages WHERE id = ?', [id]);
}

// ---------- Posts ----------

const PUBLISHED = "status = 'published' AND (published_at IS NULL OR published_at <= strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime'))";

export function listPosts(opts: { type?: PostType; includeDrafts?: boolean; categoryIds?: number[]; tagId?: number; limit?: number } = {}): Post[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.type) {
    where.push('type = ?');
    params.push(opts.type);
  }
  if (!opts.includeDrafts) where.push(PUBLISHED);
  if (opts.categoryIds) {
    if (opts.categoryIds.length === 0) return [];
    where.push(`category_id IN (${opts.categoryIds.map(() => '?').join(',')})`);
    params.push(...opts.categoryIds);
  }
  if (opts.tagId) {
    where.push('id IN (SELECT post_id FROM post_tags WHERE tag_id = ?)');
    params.push(opts.tagId);
  }
  const sql = `SELECT * FROM posts ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY COALESCE(published_at, created_at) DESC ${opts.limit ? 'LIMIT ' + Number(opts.limit) : ''}`;
  return all<Post>(sql, params);
}

export function getPost(id: number): Post | undefined {
  return get<Post>('SELECT * FROM posts WHERE id = ?', [id]);
}

export function getPostBySlug(type: PostType, slug: string, includeDrafts = false): Post | undefined {
  return get<Post>(`SELECT * FROM posts WHERE type = ? AND slug = ? ${includeDrafts ? '' : 'AND ' + PUBLISHED}`, [type, slug]);
}

/** Previous (older) and next (newer) published posts of the same type. */
export function getAdjacentPosts(post: Post): { prev?: Post; next?: Post } {
  const date = post.published_at ?? post.created_at;
  const prev = get<Post>(
    `SELECT * FROM posts WHERE type = ? AND ${PUBLISHED} AND COALESCE(published_at, created_at) < ? ORDER BY COALESCE(published_at, created_at) DESC LIMIT 1`,
    [post.type, date],
  );
  const next = get<Post>(
    `SELECT * FROM posts WHERE type = ? AND ${PUBLISHED} AND COALESCE(published_at, created_at) > ? ORDER BY COALESCE(published_at, created_at) ASC LIMIT 1`,
    [post.type, date],
  );
  return { prev, next };
}

export type PostInput = Omit<Post, 'id' | 'created_at' | 'updated_at'> & { tag_ids: number[] };

export function savePost(input: PostInput, id?: number): number {
  const { tag_ids, ...fields } = input;
  return transaction(() => {
    let postId = id;
    if (postId) {
      run(
        `UPDATE posts SET type=:type, slug=:slug, title=:title, excerpt=:excerpt, content=:content, format=:format, template=:template,
         cover_image=:cover_image, category_id=:category_id, show_toc=:show_toc, meta_description=:meta_description,
         status=:status, published_at=:published_at, updated_at=datetime('now') WHERE id=:id`,
        { ...fields, id: postId },
      );
    } else {
      const res = run(
        `INSERT INTO posts (type, slug, title, excerpt, content, format, template, cover_image, category_id, show_toc, meta_description, status, published_at)
         VALUES (:type, :slug, :title, :excerpt, :content, :format, :template, :cover_image, :category_id, :show_toc, :meta_description, :status, :published_at)`,
        fields,
      );
      postId = Number(res.lastInsertRowid);
    }
    run('DELETE FROM post_tags WHERE post_id = ?', [postId]);
    for (const tagId of tag_ids) run('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tagId]);
    return postId;
  });
}

export function deletePost(id: number) {
  run('DELETE FROM posts WHERE id = ?', [id]);
}

export function getPostTags(postId: number): Tag[] {
  return all<Tag>('SELECT t.* FROM tags t JOIN post_tags pt ON pt.tag_id = t.id WHERE pt.post_id = ? ORDER BY t.name', [postId]);
}

// ---------- Taxonomies ----------

export function listCategories(): Category[] {
  return all<Category>('SELECT * FROM categories ORDER BY position, name');
}

export function getCategory(id: number): Category | undefined {
  return get<Category>('SELECT * FROM categories WHERE id = ?', [id]);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return get<Category>('SELECT * FROM categories WHERE slug = ?', [slug]);
}

export function childCategories(parentId: number): Category[] {
  return all<Category>('SELECT * FROM categories WHERE parent_id = ? ORDER BY position, name', [parentId]);
}

export function saveCategory(input: Omit<Category, 'id'>, id?: number): number {
  if (id) {
    run('UPDATE categories SET slug=:slug, name=:name, description=:description, parent_id=:parent_id, position=:position WHERE id=:id', { ...input, id });
    return id;
  }
  const res = run(
    'INSERT INTO categories (slug, name, description, parent_id, position) VALUES (:slug, :name, :description, :parent_id, :position)',
    input,
  );
  return Number(res.lastInsertRowid);
}

export function deleteCategory(id: number) {
  run('DELETE FROM categories WHERE id = ?', [id]);
}

export function listTags(): (Tag & { count: number })[] {
  return all('SELECT t.*, (SELECT COUNT(*) FROM post_tags pt WHERE pt.tag_id = t.id) AS count FROM tags t ORDER BY t.name');
}

export function getTagBySlug(slug: string): Tag | undefined {
  return get<Tag>('SELECT * FROM tags WHERE slug = ?', [slug]);
}

export function saveTag(input: Omit<Tag, 'id'>, id?: number): number {
  if (id) {
    run('UPDATE tags SET slug=:slug, name=:name WHERE id=:id', { ...input, id });
    return id;
  }
  return Number(run('INSERT INTO tags (slug, name) VALUES (:slug, :name)', input).lastInsertRowid);
}

export function deleteTag(id: number) {
  run('DELETE FROM tags WHERE id = ?', [id]);
}

// ---------- Search ----------

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  thumbnail: string | null;
  typeLabel: string;
}

export function search(query: string, limit = 8): SearchResult[] {
  const like = `%${query.replace(/[%_]/g, (c) => '\\' + c)}%`;
  const posts = all<Post>(
    `SELECT * FROM posts WHERE ${PUBLISHED} AND (title LIKE :q ESCAPE '\\' OR content LIKE :q ESCAPE '\\' OR excerpt LIKE :q ESCAPE '\\')
     ORDER BY (title LIKE :q ESCAPE '\\') DESC, COALESCE(published_at, created_at) DESC LIMIT :limit`,
    { q: like, limit },
  );
  const pages = all<Page>(
    `SELECT * FROM pages WHERE status = 'published' AND (title LIKE :q ESCAPE '\\' OR content LIKE :q ESCAPE '\\')
     ORDER BY (title LIKE :q ESCAPE '\\') DESC LIMIT :limit`,
    { q: like, limit },
  );
  return [
    ...posts.map((p) => ({
      id: `post-${p.id}`,
      title: p.title,
      url: postUrl(p),
      excerpt: truncateWords(excerptOf(p), 18),
      thumbnail: p.cover_image,
      typeLabel: POST_TYPES[p.type].label,
    })),
    ...pages.map((p) => ({
      id: `page-${p.id}`,
      title: p.title,
      url: pageUrl(p),
      excerpt: truncateWords(stripHtml(renderBody(p.content, p.format)), 18),
      thumbnail: p.cover_image,
      typeLabel: 'Page',
    })),
  ].slice(0, limit);
}
