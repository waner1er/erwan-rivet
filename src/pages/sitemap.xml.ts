import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/url.ts';
import { categoryUrl, listCategories, listPages, listPosts, pageUrl, postUrl } from '../lib/content.ts';

export const GET: APIRoute = ({ site, url }) => {
  const entries = [
    ...listPages()
      .filter((p) => p.status === 'published')
      .map((p) => ({ loc: pageUrl(p), lastmod: p.updated_at })),
    ...listPosts().map((p) => ({ loc: postUrl(p), lastmod: p.updated_at })),
    ...listCategories().map((c) => ({ loc: categoryUrl(c), lastmod: null })),
  ];
  const body = entries
    .map((e) => `<url><loc>${absoluteUrl(e.loc, site, url.origin)}</loc>${e.lastmod ? `<lastmod>${e.lastmod.slice(0, 10)}</lastmod>` : ''}</url>`)
    .join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
