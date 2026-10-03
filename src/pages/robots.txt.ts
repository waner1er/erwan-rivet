import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/url.ts';

// AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended...) are
// explicitly allowed: the goal is to be well represented in AI-generated
// answers (GEO), same spirit as llms.txt.
const AI_CRAWLERS = ['GPTBot', 'ClaudeBot', 'Claude-Web', 'Google-Extended', 'PerplexityBot', 'anthropic-ai', 'CCBot', 'Applebot-Extended'];

export const GET: APIRoute = ({ site, url }) => {
  const lines = ['User-agent: *', 'Disallow: /admin/', 'Disallow: /api/', ''];
  for (const bot of AI_CRAWLERS) lines.push(`User-agent: ${bot}`, 'Allow: /', '');
  lines.push(`Sitemap: ${absoluteUrl('/sitemap.xml', site, url.origin)}`);
  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
