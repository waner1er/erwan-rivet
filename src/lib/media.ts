import fs from 'node:fs';
import path from 'node:path';
import { all, get, run, UPLOADS_DIR } from './db.ts';
import { slugify } from './content.ts';

export interface Media {
  id: number;
  path: string;
  filename: string;
  mime: string;
  size: number;
  created_at: string;
}

const ALLOWED: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const ACCEPT = Object.keys(ALLOWED).join(',');

export function listMedia(): Media[] {
  return all<Media>('SELECT * FROM media ORDER BY created_at DESC, id DESC');
}

export async function saveUpload(file: File): Promise<Media> {
  const ext = path.extname(file.name).toLowerCase();
  const mime = ALLOWED[ext];
  if (!mime) throw new Error(`Type de fichier non autorisé : ${file.name}`);
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`Fichier trop volumineux (15 Mo max) : ${file.name}`);

  const now = new Date();
  const dir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const base = slugify(path.basename(file.name, ext)) || 'fichier';
  fs.mkdirSync(path.join(UPLOADS_DIR, dir), { recursive: true });

  let name = `${base}${ext}`;
  for (let i = 2; fs.existsSync(path.join(UPLOADS_DIR, dir, name)); i++) name = `${base}-${i}${ext}`;

  await fs.promises.writeFile(path.join(UPLOADS_DIR, dir, name), Buffer.from(await file.arrayBuffer()));
  const publicPath = `/uploads/${dir}/${name}`;
  const res = run('INSERT INTO media (path, filename, mime, size) VALUES (?, ?, ?, ?)', [publicPath, name, mime, file.size]);
  return get<Media>('SELECT * FROM media WHERE id = ?', [Number(res.lastInsertRowid)])!;
}

export function deleteMedia(id: number) {
  const media = get<Media>('SELECT * FROM media WHERE id = ?', [id]);
  if (!media) return;
  const abs = path.resolve(UPLOADS_DIR, media.path.replace(/^\/uploads\//, ''));
  if (abs.startsWith(UPLOADS_DIR + path.sep)) {
    fs.rmSync(abs, { force: true });
    // Resized WordPress variants (name-300x200.ext) of an imported original.
    const { dir, name, ext } = path.parse(abs);
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir)) {
        if (f.startsWith(`${name}-`) && f.endsWith(ext) && /-\d+x\d+$/.test(path.parse(f).name)) fs.rmSync(path.join(dir, f), { force: true });
      }
    }
  }
  run('DELETE FROM media WHERE id = ?', [id]);
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}
