import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/url.ts';

export const GET: APIRoute = ({ site, url }) => {
  return new Response(`User-agent: *\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${absoluteUrl('/sitemap.xml', site, url.origin)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
