import type { APIRoute } from 'astro';
import { isDynamicBlock, renderDynamicBlock } from '../../../lib/blocks/render.ts';
import { getSettings } from '../../../lib/settings.ts';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

// Editor preview of a dynamic block: the exact HTML the site renders for these attributes.
export const GET: APIRoute = ({ url }) => {
  const name = url.searchParams.get('name') ?? '';
  if (!isDynamicBlock(name)) return json({ error: 'Bloc inconnu.' }, 400);
  let attributes: Record<string, unknown> = {};
  try {
    attributes = JSON.parse(url.searchParams.get('attributes') ?? '{}');
  } catch {
    return json({ error: 'Attributs invalides.' }, 400);
  }
  let n = 0;
  return json({ html: renderDynamicBlock(name, attributes, { settings: getSettings(), currentPath: '', uid: () => ++n }) });
};
