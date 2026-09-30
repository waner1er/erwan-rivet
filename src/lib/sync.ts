// Keeps the site content versionable: `content/*.json` (+ `content/uploads/`) is the source of truth,
// the SQLite database is a local cache that also holds private data (users, sessions, messages).
//
// - Every back-office write exports the content tables to JSON (see middleware).
// - On startup, and whenever the JSON files change on disk (git pull), they are imported back.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';

export const CONTENT_DIR = path.resolve(process.env.CONTENT_DIR ?? 'content');

/** Content tables in import order, with the column used to sort exports (stable diffs). */
const TABLES: { name: string; order: string }[] = [
  { name: 'settings', order: 'key' },
  { name: 'pages', order: 'id' },
  { name: 'categories', order: 'id' },
  { name: 'tags', order: 'id' },
  { name: 'posts', order: 'id' },
  { name: 'post_tags', order: 'post_id, tag_id' },
  { name: 'media', order: 'id' },
];

const fileOf = (table: string) => path.join(CONTENT_DIR, `${table}.json`);

function readFiles(): Map<string, string> | null {
  const files = new Map<string, string>();
  for (const { name } of TABLES) {
    const file = fileOf(name);
    if (!fs.existsSync(file)) return null;
    // Line endings may differ between machines (git autocrlf).
    files.set(name, fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'));
  }
  return files;
}

function hashOf(files: Map<string, string>): string {
  const h = createHash('sha256');
  for (const { name } of TABLES) h.update(name).update('\0').update(files.get(name) ?? '').update('\0');
  return h.digest('hex');
}

/** Cheap fingerprint (mtimes + sizes) to notice file changes without hashing on every request. */
function statSignature(): string {
  return TABLES.map(({ name }) => {
    try {
      const s = fs.statSync(fileOf(name));
      return `${s.mtimeMs}:${s.size}`;
    } catch {
      return '-';
    }
  }).join('|');
}

let lastSignature = '';

function getMeta(db: DatabaseSync, key: string): string | undefined {
  return (db.prepare('SELECT value FROM meta WHERE key = ?').get(key) as { value: string } | undefined)?.value;
}

function setMeta(db: DatabaseSync, key: string, value: string) {
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}

export function exportContent(db: DatabaseSync) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  const files = new Map<string, string>();
  for (const { name, order } of TABLES) {
    const rows = db.prepare(`SELECT * FROM ${name} ORDER BY ${order}`).all();
    const json = JSON.stringify(rows.map((r) => ({ ...r })), null, 2) + '\n';
    files.set(name, json);
    const file = fileOf(name);
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== json) fs.writeFileSync(file, json);
  }
  setMeta(db, 'content_hash', hashOf(files));
  lastSignature = statSignature();
}

function importFiles(db: DatabaseSync, files: Map<string, string>) {
  db.exec('PRAGMA foreign_keys = OFF');
  db.exec('BEGIN');
  try {
    for (const { name } of [...TABLES].reverse()) db.exec(`DELETE FROM ${name}`);
    for (const { name } of TABLES) {
      const rows = JSON.parse(files.get(name) ?? '[]') as Record<string, unknown>[];
      for (const row of rows) {
        const cols = Object.keys(row);
        db.prepare(`INSERT INTO ${name} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).run(
          ...(cols.map((c) => row[c]) as (string | number | null)[]),
        );
      }
    }
    setMeta(db, 'content_hash', hashOf(files));
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  } finally {
    db.exec('PRAGMA foreign_keys = ON');
  }
}

export function importContent(db: DatabaseSync): boolean {
  const files = readFiles();
  if (!files) return false;
  importFiles(db, files);
  lastSignature = statSignature();
  return true;
}

/**
 * Brings the database in line with content/: imports when the files changed since the last
 * import/export, or bootstraps content/ from an existing database that predates it.
 */
export function syncContent(db: DatabaseSync) {
  const signature = statSignature();
  if (signature === lastSignature) return;
  const files = readFiles();
  if (!files) {
    const hasContent = (db.prepare('SELECT COUNT(*) AS n FROM pages').get() as { n: number }).n > 0;
    if (hasContent) exportContent(db);
    return;
  }
  if (hashOf(files) !== getMeta(db, 'content_hash')) {
    importFiles(db, files);
    console.log('[contenu] base mise à jour depuis content/');
  }
  lastSignature = signature;
}
