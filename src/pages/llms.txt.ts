// llms.txt (https://llmstxt.org): a plain-text summary of the site aimed at
// LLMs/AI crawlers, so they can understand what this site is about and find
// its key pages without having to crawl everything. Generated from the same
// content source as sitemap.xml/feed.xml, so it stays accurate automatically
// as pages/posts are published — no manual upkeep needed.
import type { APIRoute } from 'astro';
import { excerptOf, listPages, listPosts, pageUrl, POST_TYPES, postUrl, truncateWords, stripHtml, renderBody } from '../lib/content.ts';
import { getSettings } from '../lib/settings.ts';
import { absoluteUrl } from '../lib/url.ts';

export const GET: APIRoute = ({ site, url }) => {
  const settings = getSettings();
  const origin = url.origin;

  const pages = listPages().filter((p) => p.status === 'published' && p.slug !== '');
  const posts = listPosts();

  const lines: string[] = [];
  lines.push(`# ${settings.siteTitle}`);
  lines.push('');
  lines.push(`> ${settings.tagline}. Site professionnel présentant les prestations, réalisations et articles techniques.`);
  lines.push('');

  lines.push('## Pages');
  for (const p of pages) {
    const desc = p.meta_description ?? truncateWords(stripHtml(renderBody(p.content, p.format)), 25);
    lines.push(`- [${p.title}](${absoluteUrl(pageUrl(p), site, origin)}): ${desc}`);
  }
  lines.push('');

  for (const type of Object.keys(POST_TYPES) as (keyof typeof POST_TYPES)[]) {
    const items = posts.filter((p) => p.type === type);
    if (items.length === 0) continue;
    lines.push(`## ${POST_TYPES[type].plural}`);
    for (const post of items) {
      const desc = post.meta_description ?? excerptOf(post);
      lines.push(`- [${post.title}](${absoluteUrl(postUrl(post), site, origin)}): ${desc}`);
    }
    lines.push('');
  }

  lines.push('## Flux');
  lines.push(`- [Sitemap](${absoluteUrl('/sitemap.xml', site, origin)})`);
  lines.push(`- [Flux RSS](${absoluteUrl('/feed.xml', site, origin)})`);

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
