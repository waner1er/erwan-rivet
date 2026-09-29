import type { APIRoute } from 'astro';
import { search } from '../../lib/content.ts';

export const GET: APIRoute = ({ url }) => {
  const query = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
  const results = query.length >= 2 ? search(query, 8) : [];
  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
};
