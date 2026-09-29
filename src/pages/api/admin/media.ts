import type { APIRoute } from 'astro';
import { listMedia, saveUpload } from '../../../lib/media.ts';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

export const GET: APIRoute = () => json(listMedia());

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const files = form.getAll('file').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return json({ error: 'Aucun fichier reçu.' }, 400);
  try {
    const saved = [];
    for (const file of files) saved.push(await saveUpload(file));
    return json(saved, 201);
  } catch (err) {
    return json({ error: (err as Error).message }, 400);
  }
};
