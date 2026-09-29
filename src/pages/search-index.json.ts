import type { APIRoute } from 'astro';
import { excerptOf, listPages, listPosts, pageUrl, POST_TYPES, postUrl, renderBody, stripHtml, truncateWords } from '../lib/content.ts';

// Search runs in the browser against this index, so it also works on a static host.
export const GET: APIRoute = () => {
  const posts = listPosts().map((p) => {
    const text = stripHtml(renderBody(p.content, p.format));
    return {
      title: p.title,
      url: postUrl(p),
      excerpt: truncateWords(excerptOf(p), 18),
      thumbnail: p.cover_image,
      typeLabel: POST_TYPES[p.type].label,
      text: `${p.excerpt ?? ''} ${text}`.slice(0, 5000),
    };
  });
  const pages = listPages()
    .filter((p) => p.status === 'published')
    .map((p) => {
      const text = stripHtml(renderBody(p.content, p.format));
      return {
        title: p.title,
        url: pageUrl(p),
        excerpt: truncateWords(text, 18),
        thumbnail: p.cover_image,
        typeLabel: 'Page',
        text: text.slice(0, 5000),
      };
    });
  return new Response(JSON.stringify([...posts, ...pages]), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
