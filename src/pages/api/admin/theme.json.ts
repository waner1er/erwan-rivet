import type { APIRoute } from 'astro';
import { readTheme } from '../../../lib/theme.ts';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(readTheme()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
