import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { UPLOADS_DIR } from '../../lib/db.ts';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

// Uploaded media live outside the build output (data/uploads) so they survive deployments.
export const GET: APIRoute = async ({ params }) => {
  const rel = params.file ?? '';
  const abs = path.resolve(UPLOADS_DIR, rel);
  if (!abs.startsWith(UPLOADS_DIR + path.sep)) return new Response('Not found', { status: 404 });

  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(abs);
  } catch {
    return new Response('Not found', { status: 404 });
  }
  if (!stat.isFile()) return new Response('Not found', { status: 404 });

  const ext = path.extname(abs).toLowerCase();
  const headers: Record<string, string> = {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    'Content-Length': String(stat.size),
    'Cache-Control': 'public, max-age=2592000',
    'Last-Modified': stat.mtime.toUTCString(),
    'X-Content-Type-Options': 'nosniff',
  };
  // SVGs can carry scripts: sandbox them when opened directly.
  if (ext === '.svg') headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
  return new Response(await fs.promises.readFile(abs), { headers });
};
