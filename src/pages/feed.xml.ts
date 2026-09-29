import type { APIRoute } from 'astro';
import { excerptOf, listPosts, postUrl } from '../lib/content.ts';
import { getSettings } from '../lib/settings.ts';
import { absoluteUrl } from '../lib/url.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = ({ site, url }) => {
  const settings = getSettings();
  const items = listPosts({ type: 'post', limit: 20 })
    .map((post) => {
      const link = absoluteUrl(postUrl(post), site, url.origin);
      const date = new Date(post.published_at ?? post.created_at).toUTCString();
      return `<item><title>${esc(post.title)}</title><link>${link}</link><guid>${link}</guid><pubDate>${date}</pubDate><description>${esc(excerptOf(post))}</description></item>`;
    })
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(settings.siteTitle)}</title><link>${absoluteUrl('/', site, url.origin)}</link><description>${esc(settings.tagline)}</description><language>fr-FR</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
